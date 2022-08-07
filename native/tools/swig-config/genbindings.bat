@echo %off

rem SET PATH=%PATH%;c:\whatever\else

set DIR=%~dp0
set COCOS_NATIVE_ROOT=%DIR%..\..

for %%i in ("%COCOS_NATIVE_ROOT%") do SET COCOS_NATIVE_ROOT=%%~fi

echo COCOS_NATIVE_ROOT=%COCOS_NATIVE_ROOT%

set SWIG_ROOT=%DIR%swig
set PATH=%SWIG_ROOT%\build;%SWIG_ROOT%\build\Debug;%PATH%
set SWIG_LIB=%SWIG_ROOT%\Lib

lua.exe genbindings.lua

pause
