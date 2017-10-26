@echo off

set THIS_DIR=%~dp0
set PLAT=%1

set INPUT=idl
set OUTPUT=gen

set WORK_DIR=%CD%
set MODULENAME=modulename

for /f %%i in ("%WORK_DIR%") do set MODULENAME=%%~ni
echo gen module %MODULENAME% ...

if not exist %OUTPUT% md %OUTPUT%
cmd /c xidl %THIS_DIR%bindings\%PLAT%\cxxhead.js %INPUT% %OUTPUT%\*.h
cmd /c xidl %THIS_DIR%bindings\%PLAT%\binding.js %INPUT% %OUTPUT%\*Binding.hpp
copy /Y /B %THIS_DIR%bindings\%PLAT%\binding_duktape.hpp  %OUTPUT%\binding_duktape.hpp
copy /Y /B %THIS_DIR%bindings\%PLAT%\module_entry.h  %OUTPUT%\module_entry.h

echo MODULE_API duk_ret_t dukopen_%MODULENAME%(duk_context* ctx); >> %OUTPUT%\module_entry.h
 



