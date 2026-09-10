$ErrorActionPreference = "SilentlyContinue"

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
} catch {}

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Get-MediaData {
    try {
        $sessionManagerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
        $sessionManagerTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]).Invoke($null, @($sessionManagerAsync))
        $mgr = $sessionManagerTask.Result
        if ($null -eq $mgr) { return $null }

        $currentSession = $mgr.GetCurrentSession()
        if ($null -eq $currentSession) { return $null }

        $mediaPropsAsync = $currentSession.TryGetMediaPropertiesAsync()
        $mediaPropsTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]).Invoke($null, @($mediaPropsAsync))
        $props = $mediaPropsTask.Result

        $playbackInfo = $currentSession.GetPlaybackInfo()
        $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

        $thumbnail = $null
        try {
            if ($null -ne $props.Thumbnail) {
                $thumbnailAsync = $props.Thumbnail.OpenReadAsync()
                $thumbnailTask = $asTaskGeneric.MakeGenericMethod([Windows.Storage.Streams.IRandomAccessStreamWithContentType]).Invoke($null, @($thumbnailAsync))
                $thumbnailStream = $thumbnailTask.Result
                $asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethods() |
                    Where-Object { $_.Name -eq "AsStream" -and $_.GetParameters().Count -eq 1 } |
                    Select-Object -First 1
                if ($null -eq $asStreamMethod) {
                    throw "Windows Runtime AsStream method is unavailable"
                }
                $dotnetStream = $asStreamMethod.Invoke($null, @($thumbnailStream))
                $memoryStream = [System.IO.MemoryStream]::new()
                $dotnetStream.CopyTo($memoryStream)
                $contentType = $thumbnailStream.ContentType
                $thumbnailBytes = $memoryStream.ToArray()
                $thumbnail = "data:$contentType;base64,$([Convert]::ToBase64String($thumbnailBytes))"
                $memoryStream.Dispose()
                $dotnetStream.Dispose()
                $thumbnailStream.Dispose()
            }
        } catch {
            # Thumbnail unavailable for this source — skip silently
        }

        $timeline = $currentSession.GetTimelineProperties()
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
            sourceAppId = $currentSession.SourceAppId
            thumbnail = $thumbnail
            position = $position
            duration = $duration
        }
    } catch {
        return $null
    }
}

$lastJson = ""

while ($true) {
    $curr = Get-MediaData
    $json = if ($null -ne $curr -and $curr.title) {
        $curr | ConvertTo-Json -Compress
    } else {
        '{"active":false}'
    }

    if ($json -ne $lastJson) {
        $lastJson = $json
        [Console]::WriteLine($json)
    }

    Start-Sleep -Milliseconds 1200
}