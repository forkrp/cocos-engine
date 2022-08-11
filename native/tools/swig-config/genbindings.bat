@echo %off

set DIR=%~dp0
set COCOS_NATIVE_ROOT=%DIR%..\..

for %%i in ("%COCOS_NATIVE_ROOT%") do SET COCOS_NATIVE_ROOT=%%~fi

echo COCOS_NATIVE_ROOT=%COCOS_NATIVE_ROOT%

set SWIG_ROOT=C:/projects/swig-install

set SWIG_EXE=%SWIG_ROOT%/bin/swig
set SWIG_LIB=%SWIG_ROOT%/share/swig/4.1.0

.\lua.exe genbindings.lua
