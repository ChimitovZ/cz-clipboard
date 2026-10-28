param([Parameter(Position=0)][string]$Action, [Parameter(Position=1)][string]$Arg1)

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class CzWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder t, int n);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr extra);
  public static void Paste() {
    keybd_event(0x11, 0, 0, UIntPtr.Zero);
    keybd_event(0x56, 0, 0, UIntPtr.Zero);
    keybd_event(0x56, 0, 2, UIntPtr.Zero);
    keybd_event(0x11, 0, 2, UIntPtr.Zero);
  }
}
"@

if ($Action -eq 'fg') {
  $h = [CzWin]::GetForegroundWindow()
  $pid = [uint32]0
  [void][CzWin]::GetWindowThreadProcessId($h, [ref]$pid)
  $sb = New-Object System.Text.StringBuilder 512
  [void][CzWin]::GetWindowText($h, $sb, 512)
  $name = ''
  $exe = ''
  try {
    $p = Get-Process -Id $pid -ErrorAction Stop
    $name = $p.ProcessName
    $exe = $p.Path
  } catch {}
  $obj = @{ hwnd = $h.ToInt64().ToString(); pid = $pid; title = $sb.ToString(); app = $name; path = $exe }
  $obj | ConvertTo-Json -Compress
  exit 0
}

if ($Action -eq 'focus') {
  $h = [IntPtr][int64]$Arg1
  [void][CzWin]::ShowWindow($h, 9)
  [void][CzWin]::SetForegroundWindow($h)
  exit 0
}

if ($Action -eq 'paste') {
  [CzWin]::Paste()
  exit 0
}
