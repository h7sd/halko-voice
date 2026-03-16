; ============================================================
;  Halko Voice — Dark Installer UI Override (installer.nsh)
;  Uses ONLY macro-based code injection.
;  All page functions are defined via !macro and called via
;  !insertmacro inside the appropriate hook macros.
; ============================================================

; ── Variables (top-level is fine for Var declarations) ─────
Var hv_FontBig
Var hv_FontTitle
Var hv_FontMed
Var hv_FontSmall
Var hv_Dialog
Var hv_ProgressBar
Var hv_StatusLabel
Var hv_AnimStep
Var hv_LaunchCheck

; ============================================================
;  customHeader — injected BEFORE .onInit in installer.nsi
;  Safe to !include here; page macros defined here too.
; ============================================================
!macro customHeader
  !include "LogicLib.nsh"
  !include "WinMessages.nsh"
  !include "nsDialogs.nsh"

  ; ── Welcome page function ─────────────────────────────────
  !ifndef HV_WELCOME_DEFINED
  !define HV_WELCOME_DEFINED
  Function hv_WelcomePage
    nsDialogs::Create 1018
    Pop $hv_Dialog
    ${If} $hv_Dialog == error
      Abort
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 100% ""
    Pop $R9
    SetCtlColors $R9 "" "000814"
    ${NSD_CreateLabel} 0u 0u 4u 100% ""
    Pop $R9
    SetCtlColors $R9 "" "007AFF"
    ${NSD_CreateLabel} 18u 22u 52u 52u "H"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontBig 0
    SetCtlColors $R9 "FFFFFF" "007AFF"
    ${NSD_CreateLabel} 80u 22u 200u 28u "Halko Voice"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontBig 0
    SetCtlColors $R9 "EEEEF8" "000814"
    ${NSD_CreateLabel} 80u 52u 150u 14u "Version ${VERSION}"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "000814"
    ${NSD_CreateLabel} 18u 86u 244u 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    ${NSD_CreateLabel} 18u 98u 244u 44u "Dein Discord-Sprachassistent mit KI-Stimme.$\n$\nSprich durch deinen Bot — smooth, schnell, smart."
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "8888A8" "000814"
    ${NSD_CreateLabel} 18u 152u 62u 17u " Edge TTS "
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "001A35"
    ${NSD_CreateLabel} 88u 152u 52u 17u " Groq AI "
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "001A35"
    ${NSD_CreateLabel} 148u 152u 76u 17u " Discord Bot "
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "001A35"
    ${NSD_CreateLabel} 0u 198u 100% 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    ${NSD_CreateLabel} 18u 206u 160u 13u "Klick Weiter um fortzufahren"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "44445A" "000814"
    GetDlgItem $R9 $HWNDPARENT 1
    SendMessage $R9 ${WM_SETFONT} $hv_FontMed 0
    SetCtlColors $R9 "FFFFFF" "007AFF"
    GetDlgItem $R9 $HWNDPARENT 2
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "8888A8" "000814"
    nsDialogs::Show
  FunctionEnd
  Function hv_WelcomeLeave
  FunctionEnd

  ; ── Finish page function ──────────────────────────────────
  Function hv_FinishPage
    nsDialogs::Create 1018
    Pop $hv_Dialog
    ${If} $hv_Dialog == error
      Abort
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 100% ""
    Pop $R9
    SetCtlColors $R9 "" "000814"
    ${NSD_CreateLabel} 0u 0u 4u 100% ""
    Pop $R9
    SetCtlColors $R9 "" "22D46E"
    ${NSD_CreateLabel} 18u 20u 44u 44u " OK "
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontTitle 0
    SetCtlColors $R9 "FFFFFF" "22D46E"
    ${NSD_CreateLabel} 72u 20u 188u 20u "Installation abgeschlossen!"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontTitle 0
    SetCtlColors $R9 "EEEEF8" "000814"
    ${NSD_CreateLabel} 72u 43u 188u 13u "Halko Voice ist einsatzbereit."
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "22D46E" "000814"
    ${NSD_CreateLabel} 18u 76u 244u 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    ${NSD_CreateLabel} 18u 88u 244u 13u "Ein Shortcut wurde auf dem Desktop erstellt."
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "44445A" "000814"
    ${NSD_CreateCheckbox} 18u 114u 220u 16u " Halko Voice jetzt starten"
    Pop $hv_LaunchCheck
    SendMessage $hv_LaunchCheck ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $hv_LaunchCheck "EEEEF8" "000814"
    ${NSD_Check} $hv_LaunchCheck
    ${NSD_CreateLabel} 0u 198u 100% 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    GetDlgItem $R9 $HWNDPARENT 1
    SendMessage $R9 ${WM_SETFONT} $hv_FontMed 0
    SetCtlColors $R9 "FFFFFF" "22D46E"
    GetDlgItem $R9 $HWNDPARENT 3
    ShowWindow $R9 ${SW_HIDE}
    GetDlgItem $R9 $HWNDPARENT 2
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "8888A8" "000814"
    nsDialogs::Show
  FunctionEnd
  Function hv_FinishLeave
    ${NSD_GetState} $hv_LaunchCheck $R9
    ${If} $R9 == ${BST_CHECKED}
      Exec '"$INSTDIR\${APP_FILENAME}.exe"'
    ${EndIf}
  FunctionEnd

  ; ── Install animation function ────────────────────────────
  Function hv_InstallAnim
    nsDialogs::Create 1018
    Pop $hv_Dialog
    ${If} $hv_Dialog == error
      Return
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 100% ""
    Pop $R9
    SetCtlColors $R9 "" "000814"
    ${NSD_CreateLabel} 0u 0u 4u 100% ""
    Pop $R9
    SetCtlColors $R9 "" "007AFF"
    ${NSD_CreateLabel} 18u 14u 244u 18u "Halko Voice wird eingerichtet..."
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontTitle 0
    SetCtlColors $R9 "EEEEF8" "000814"
    ${NSD_CreateLabel} 18u 34u 244u 13u "Vorbereitung..."
    Pop $hv_StatusLabel
    SendMessage $hv_StatusLabel ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $hv_StatusLabel "8888A8" "000814"
    ${NSD_CreateLabel} 18u 56u 244u 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    ${NSD_CreateLabel} 18u 70u 244u 8u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    ${NSD_CreateLabel} 18u 70u 0u 8u ""
    Pop $hv_ProgressBar
    SetCtlColors $hv_ProgressBar "" "007AFF"
    ${NSD_CreateLabel} 18u 90u 12u 13u "1"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "000814"
    ${NSD_CreateLabel} 36u 90u 220u 13u "Dateien installieren"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "44445A" "000814"
    ${NSD_CreateLabel} 18u 108u 12u 13u "2"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "000814"
    ${NSD_CreateLabel} 36u 108u 220u 13u "Shortcuts erstellen"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "44445A" "000814"
    ${NSD_CreateLabel} 18u 126u 12u 13u "3"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "007AFF" "000814"
    ${NSD_CreateLabel} 36u 126u 220u 13u "Windows Registry"
    Pop $R9
    SendMessage $R9 ${WM_SETFONT} $hv_FontSmall 0
    SetCtlColors $R9 "44445A" "000814"
    ${NSD_CreateLabel} 0u 198u 100% 1u ""
    Pop $R9
    SetCtlColors $R9 "" "001A35"
    nsDialogs::Show /NOUNLOAD
    StrCpy $hv_AnimStep 0
    ${NSD_SetText} $hv_StatusLabel "Dateien werden eingerichtet..."
    ${While} $hv_AnimStep < 40
      IntOp $hv_AnimStep $hv_AnimStep + 1
      IntOp $R1 $hv_AnimStep * 244
      IntOp $R1 $R1 / 100
      System::Call "user32::MoveWindow(i $hv_ProgressBar, i 18, i 70, i $R1, i 8, i 1)"
      Sleep 16
    ${EndWhile}
    ${NSD_SetText} $hv_StatusLabel "Shortcuts werden erstellt..."
    ${While} $hv_AnimStep < 75
      IntOp $hv_AnimStep $hv_AnimStep + 1
      IntOp $R1 $hv_AnimStep * 244
      IntOp $R1 $R1 / 100
      System::Call "user32::MoveWindow(i $hv_ProgressBar, i 18, i 70, i $R1, i 8, i 1)"
      Sleep 9
    ${EndWhile}
    ${NSD_SetText} $hv_StatusLabel "Registry wird aktualisiert..."
    ${While} $hv_AnimStep < 95
      IntOp $hv_AnimStep $hv_AnimStep + 1
      IntOp $R1 $hv_AnimStep * 244
      IntOp $R1 $R1 / 100
      System::Call "user32::MoveWindow(i $hv_ProgressBar, i 18, i 70, i $R1, i 8, i 1)"
      Sleep 14
    ${EndWhile}
    ${While} $hv_AnimStep < 100
      IntOp $hv_AnimStep $hv_AnimStep + 1
      IntOp $R1 $hv_AnimStep * 244
      IntOp $R1 $R1 / 100
      System::Call "user32::MoveWindow(i $hv_ProgressBar, i 18, i 70, i $R1, i 8, i 1)"
      ${If} $hv_AnimStep > 96
        SetCtlColors $hv_ProgressBar "" "22D46E"
      ${EndIf}
      Sleep 26
    ${EndWhile}
    ${NSD_SetText} $hv_StatusLabel "Fertig!"
    Sleep 500
  FunctionEnd
  !endif
!macroend

; ============================================================
;  customInit — injected into .onInit — create fonts
; ============================================================
!macro customInit
  CreateFont $hv_FontBig   "Segoe UI" 26 700
  CreateFont $hv_FontTitle "Segoe UI" 15 700
  CreateFont $hv_FontMed   "Segoe UI" 12 600
  CreateFont $hv_FontSmall "Segoe UI" 10 400
!macroend

; ============================================================
;  customWelcomePage — replaces MUI welcome page
; ============================================================
!macro customWelcomePage
  Page custom hv_WelcomePage hv_WelcomeLeave
!macroend

; ============================================================
;  customFinishPage — replaces MUI finish page
; ============================================================
!macro customFinishPage
  Page custom hv_FinishPage hv_FinishLeave
!macroend

; ============================================================
;  customInstall — runs after files/shortcuts/registry done
; ============================================================
!macro customInstall
  Call hv_InstallAnim
!macroend
