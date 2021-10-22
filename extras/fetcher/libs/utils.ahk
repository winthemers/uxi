; This is AHK V2 File, named as AHK only to keep it consistent with the #include Pattern.

;------------------------------------------------------
; Converts bytes to friendly string
;------------------------------------------------------
FormatBytes(N) { ; By SKAN on CT5H/D351 @ tiny.cc/formatbytes
  Return DllCall("Shlwapi\StrFormatByteSize64A", "Int64",N, "Str",Format("{:16}",N), "Int",16, "AStr") 
}


;------------------------------------------------------
; Array join
;------------------------------------------------------
join(Array, Delimiter) 
{
  OutStr := ""
  For each, str in Array
    if (A_Index < Array.Length) {
      OutStr .= str . Delimiter
    } else {
      OutStr .= str
    }

  return OutStr
}

;-------------------------------------------------------
; Get current UxTheme Name
;-------------------------------------------------------
GetCurrentTheme()
{
  Size := VarSetStrCapacity(&ThemeName, 260 << 1)
  if (DllCall("uxtheme\GetCurrentThemeName", "str", ThemeName, "int", Size, "ptr", 0, "int", 0, "ptr", 0, "int", 0)) {
      return 0
  }

  Exploded := StrSplit(ThemeName, "\")
  MsStyle := Exploded[Exploded.Length]

  return StrReplace(MsStyle, ".msstyles", "")
}


;-------------------------------------------------------
; Get OS Friendly name, build version and Architecture
;-------------------------------------------------------
GetOSInfo(){  
  Info := Map()

  objWMIService := ComObjGet("winmgmts:{impersonationLevel=impersonate}!\\" A_ComputerName "\root\cimv2")
  For objOperatingSystem in objWMIService.ExecQuery("Select * from Win32_OperatingSystem") {
    Info["Version"] := objOperatingSystem.Caption
    Info["Architecture"] := objOperatingSystem.OSArchitecture, 
    Info["BuildVersion"] := objOperatingSystem.Version
  }

  return Info
}



;-------------------------------------------------------
; Get Memory installed
;-------------------------------------------------------
GetTotalMemory()
{
    TotalMemory:=0
    if !(DllCall("kernel32.dll\GetPhysicallyInstalledSystemMemory", "UInt64*", &TotalMemory))
        return DllCall("kernel32.dll\GetLastError")


    return FormatBytes(TotalMemory * 1024)
  
}


;-------------------------------------------------------
; Get Disk information
;-------------------------------------------------------
GetDriveList()
{
  DriveInfo := []

  DrivesStr :=  DriveGetList()
  DrivesCount := StrLen(DrivesStr)

  Loop DrivesCount
  {
    DriveLetter := SubStr(DrivesStr, A_Index, 1)  ":\"
    DriveInfo.push(SubStr(DrivesStr, A_Index, 1) ":\ " DriveGetLabel(DriveLetter) " (" Round(DriveGetCapacity(DriveLetter) / 1024, 0) " GiB)" )
  }

  return DriveInfo

}


;-------------------------------------------------------
; Get CPU
;-------------------------------------------------------
GetProcessorInfo()
{
  Info := Map()

  objWMIService := ComObjGet("winmgmts:")
  For objProcessor in objWMIService.ExecQuery("Select * from Win32_Processor") {
   Info["Name"] := objProcessor.Name
   Info["Clock"] := objProcessor.MaxClockSpeed
   Info["Socket"] := objProcessor.SocketDesignation
  }

  return Info
}

;-------------------------------------------------------
; Get GPU
;-------------------------------------------------------
GetGrpahicsCardInfo()
{
  Info := Map()

  objWMIService := ComObjGet("winmgmts:")
  For objProcessor in objWMIService.ExecQuery("Select Caption, MaxRefreshRate from win32_VideoController") {
   Info["Name"] := objProcessor.Caption
   Info["RefreshRate"] := objProcessor.MaxRefreshRate
  }

  return Info
}



;-------------------------------------------------------
; Get Monitors
;-------------------------------------------------------
GetMonitors()
{
  Monitors := []
  i := 1
  Loop {
    mon := MonitorGetWorkArea(i, &L, &T, &R, &B)
    workAreaWidth := R - L
    workAreaHeight := B - T
    Monitors.push(workAreaWidth "x" workAreaHeight)
    i += 1
  }
  Until i > SysGet(80)

  return Monitors
}



;-------------------------------------------------------
; Converts string to Base64
;-------------------------------------------------------
StringToBase64(String, Encoding := "UTF-8")
{
	static CRYPT_STRING_BASE64 := 0x00000001
	static CRYPT_STRING_NOCRLF := 0x40000000

	Binary := Buffer(StrPut(String, Encoding))
	StrPut(String, Binary, Encoding)
	if !(DllCall("crypt32\CryptBinaryToStringW", "Ptr", Binary, "UInt", Binary.Size, "UInt", (CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF), "Ptr", 0, "UInt*", &Size := 0))
		throw Error("CryptBinaryToStringW failed", -1)

	Base64 := Buffer(Size << 1, 0)
	if !(DllCall("crypt32\CryptBinaryToStringW", "Ptr", Binary, "UInt", Binary.Size, "UInt", (CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF), "Ptr", Base64, "UInt*", Size))
		throw Error("CryptBinaryToStringW failed", -1)

	return StrGet(Base64)
}

;-------------------------------------------------------
; Applies window composition effects to WHND
;-------------------------------------------------------

SetWindowComposition(hwnd := 0, accent_state := 0, gradient_color := "0x00000000")
{
    static init:=0, ver := DllCall("GetVersion") & 0xff < 10
    static pad := A_PtrSize = 8 ? 4 : 0, WCA_ACCENT_POLICY := 19

    if (!init) {
        if (ver)
            return
            ; throw Error("Minimum support client: Windows 10", -1)
        init := 1
    }
    ACCENT_POLICY:=Buffer(16)
	NumPut("int", (accent_state > 0 && accent_state < 5) ? accent_state : 0, ACCENT_POLICY,0)
	
    if (accent_state >= 1) && (accent_state < 5) && (RegExMatch(gradient_color, "0x[[:xdigit:]]{8}"))
		NumPut("int",gradient_color, ACCENT_POLICY,8)
		
	WINCOMPATTRDATA:=Buffer(4 + pad + A_PtrSize + 4 + pad)
	NumPut("int",WCA_ACCENT_POLICY, WINCOMPATTRDATA,0)
	NumPut("ptr", ACCENT_POLICY.ptr, WINCOMPATTRDATA, 4 + pad)
	NumPut("uint",ACCENT_POLICY.Size, WINCOMPATTRDATA, 4 + pad + A_PtrSize)
    if !(DllCall("user32\SetWindowCompositionAttribute", "ptr", hwnd, "ptr", WINCOMPATTRDATA)) {
        ; msgbox "Last Error: " A_LastError ; <----------------- need to check last error to get more data
        ; throw Error("Failed to set transparency / blur", -1)
    }
    return true
}