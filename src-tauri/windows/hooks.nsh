; Dodatki do instalatora Aura Fields (szablon NSIS z Tauri dołącza ten plik na początku).
;
; Zanim pokaże się powitanie, instalator sprawdza, czy na GitHubie jest nowsza wersja gry.
; Sprawdzenie i pobranie robi sama aplikacja w trybie pomocnika (--fetch-latest): bierze
; latest.json z najnowszego wydania i weryfikuje podpis paczki, więc instalator uruchamia
; tylko podpisany przez nas plik. Gdy nowsza wersja jest, instalator przekazuje jej pracę
; i kończy się; bez sieci albo przy aktualnej wersji instaluje to, co ma w sobie.
;
; Sprawdzanie pomija się w trybie cichym (/S), z paskiem (/P, tak instaluje aktualizator
; z gry), przy /UPDATE oraz z /NOFETCH (tak uruchamiany jest pobrany nowszy instalator).

; plik gry z kompilacji; ${MAINBINARYSRCPATH} szablon definiuje dopiero po tym pliku
!define AF_HELPER_SRC "${__FILEDIR__}\..\target\release\aura-fields.exe"

Var AFChecked

Page custom AFCheckLatest

; Szablon wstawia stronę powitania jako pierwszą stronę MUI zaraz po tym pliku, więc ta
; definicja trafia do niej. Strona sprawdzania jest przed powitaniem, a „Wstecz” do niej
; nie ma sensu.
!define MUI_PAGE_CUSTOMFUNCTION_SHOW AFWelcomeShow
Function AFWelcomeShow
  GetDlgItem $0 $HWNDPARENT 3
  ShowWindow $0 ${SW_HIDE}
FunctionEnd

Function AFCheckLatest
  ${If} $AFChecked == 1
    Abort
  ${EndIf}
  StrCpy $AFChecked 1
  ${If} ${Silent}
    Abort
  ${EndIf}
  ClearErrors
  ${GetOptions} $CMDLINE "/P" $0
  ${IfNot} ${Errors}
    Abort
  ${EndIf}
  ClearErrors
  ${GetOptions} $CMDLINE "/UPDATE" $0
  ${IfNot} ${Errors}
    Abort
  ${EndIf}
  ClearErrors
  ${GetOptions} $CMDLINE "/NOFETCH" $0
  ${IfNot} ${Errors}
    Abort
  ${EndIf}

  InitPluginsDir
  File "/oname=$PLUGINSDIR\af-check.exe" "${AF_HELPER_SRC}"
  Banner::show /set 76 "Aura Fields" "Sprawdzanie najnowszej wersji gry…"
  ExecWait '"$PLUGINSDIR\af-check.exe" --fetch-latest "$PLUGINSDIR\Aura-Fields-Setup.exe"' $1
  Banner::destroy
  Delete "$PLUGINSDIR\af-check.exe"
  ${If} $1 <> 0
    Abort ; brak nowszej wersji albo brak sieci: zwykła instalacja
  ${EndIf}

  ; nowszy instalator prowadzi dalej; ten czeka ukryty, żeby nie skasować pobranego pliku
  HideWindow
  ExecWait '"$PLUGINSDIR\Aura-Fields-Setup.exe" /NOFETCH' $4
  ${If} ${Errors}
    ; nie dało się uruchomić pobranego pliku: instalujemy wbudowaną wersję
    BringToFront
    Abort
  ${EndIf}
  SetErrorLevel $4
  Quit
FunctionEnd
