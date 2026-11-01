# Streams the current Windows media session (GSMTC) to stdout as one JSON
# object per line, and accepts playback commands (toggle, play, pause, next,
# prev) one per line on stdin. Exits when stdin closes, so it never outlives
# the app that started it.

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($operation, [Type]$resultType) {
    $asTaskGeneric.MakeGenericMethod($resultType).Invoke($null, @($operation)).Result
}

$script:manager = $null
$script:thumbnailKey = $null
$script:thumbnail = $null

function Get-Session {
    if ($null -eq $script:manager) {
        $script:manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    }
    if ($null -eq $script:manager) { return $null }
    return $script:manager.GetCurrentSession()
}

function Read-Thumbnail($props) {
    if ($null -eq $props.Thumbnail) { return $null }
    try {
        $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        $asStream = [System.IO.WindowsRuntimeStreamExtensions].GetMethods() |
            Where-Object { $_.Name -eq "AsStream" -and $_.GetParameters().Count -eq 1 } |
            Select-Object -First 1
        $dotnetStream = $asStream.Invoke($null, @($stream))
        $memory = [System.IO.MemoryStream]::new()
        $dotnetStream.CopyTo($memory)
        $dataUrl = "data:$($stream.ContentType);base64,$([Convert]::ToBase64String($memory.ToArray()))"
        $memory.Dispose()
        # Disposing the .NET wrapper also closes the underlying WinRT stream.
        $dotnetStream.Dispose()
        return $dataUrl
    } catch {
        [Console]::Error.WriteLine("Thumbnail unavailable: $($_.Exception.Message)")
        return $null
    }
}

function Get-MediaData {
    try {
        $session = Get-Session
        if ($null -eq $session) { return $null }

        $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
        $playbackInfo = $session.GetPlaybackInfo()
        $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

        # Thumbnails are only re-read when the track changes.
        $trackKey = "$($session.SourceAppId)|$($props.Title)|$($props.Artist)|$($props.AlbumTitle)"
        if ($trackKey -ne $script:thumbnailKey) {
            $script:thumbnailKey = $trackKey
            $script:thumbnail = Read-Thumbnail $props
        }

        $timeline = $session.GetTimelineProperties()
        $position = 0
        $duration = 0
        if ($null -ne $timeline) {
            $position = [Math]::Max(0, [int]$timeline.Position.TotalMilliseconds)
            $duration = [Math]::Max(0, [int]($timeline.EndTime - $timeline.StartTime).TotalMilliseconds)
        }

        return [PSCustomObject]@{
            active = ($status -eq "Playing" -or $status -eq "Paused")
            title = $props.Title
            artist = $props.Artist
            albumTitle = $props.AlbumTitle
            status = $status
            sourceAppId = $session.SourceAppId
            thumbnail = $script:thumbnail
            position = $position
            duration = $duration
        }
    } catch {
        $script:manager = $null
        return $null
    }
}

function Invoke-MediaCommand([string]$command) {
    try {
        $session = Get-Session
        if ($null -eq $session) { return }
        $operation = switch ($command) {
            "toggle" { $session.TryTogglePlayPauseAsync() }
            "play" { $session.TryPlayAsync() }
            "pause" { $session.TryPauseAsync() }
            "next" { $session.TrySkipNextAsync() }
            "prev" { $session.TrySkipPreviousAsync() }
        }
        if ($null -ne $operation) { [void](Await $operation ([bool])) }
    } catch {
        [Console]::Error.WriteLine("Media command '$command' failed: $($_.Exception.Message)")
    }
}

# Console.In's ReadLineAsync blocks, so read stdin through a plain StreamReader.
$stdin = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8)
$pendingLine = $stdin.ReadLineAsync()
$lastJson = ""

while ($true) {
    # Wake for a command as soon as one arrives, otherwise poll every 1.2s.
    if ($pendingLine.Wait(1200)) {
        $line = $pendingLine.Result
        if ($null -eq $line) { break }
        Invoke-MediaCommand $line.Trim()
        $pendingLine = $stdin.ReadLineAsync()
    }

    $current = Get-MediaData
    $json = if ($null -ne $current -and $current.title) {
        $current | ConvertTo-Json -Compress
    } else {
        '{"active":false}'
    }

    if ($json -ne $lastJson) {
        $lastJson = $json
        [Console]::Out.WriteLine($json)
        [Console]::Out.Flush()
    }
}
