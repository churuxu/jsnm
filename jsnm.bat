@echo off

set THIS_DIR=%~dp0
set PLAT=%1

set INPUT=idl
set OUTPUT=gen

if not exist %OUTPUT% md %OUTPUT%
cmd /c xidl %THIS_DIR%bindings\%PLAT%\cxxhead.js %INPUT% %OUTPUT%\*.h
cmd /c xidl %THIS_DIR%bindings\%PLAT%\binding.js %INPUT% %OUTPUT%\*Binding.hpp
copy /Y /B %THIS_DIR%bindings\%PLAT%\binding_duktape.hpp  %OUTPUT%\binding_duktape.hpp

 