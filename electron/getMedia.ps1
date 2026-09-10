try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null

    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

    $sessionManagerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $sessionManagerTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]).Invoke($null, @($sessionManagerAsync))
    $mgr = $sessionManagerTask.Result

    $currentSession = $mgr.GetCurrentSession()
    if ($null -eq $currentSession) {
        Write-Output '{"active": false}'
        exit 0
    }

    $mediaPropsAsync = $currentSession.TryGetMediaPropertiesAsync()
    $mediaPropsTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]).Invoke($null, @($mediaPropsAsync))
    $props = $mediaPropsTask.Result

    $playbackInfo = $currentSession.GetPlaybackInfo()
    $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

    $result = [PSCustomObject]@{
        active = $true
        title = $props.Title
        artist = $props.Artist
        albumTitle = $props.AlbumTitle
        status = $status
        sourceAppId = $currentSession.SourceAppId
    }

    $result | ConvertTo-Json -Compress
} catch {
    Write-Output "{\`"active\`": false, \`"error\`": \`"$($_.Exception.Message.Replace('"', '\"'))\`"}"
}