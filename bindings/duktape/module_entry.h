#pragma once

#ifdef _MSC_VER
#define MODULE_API extern "C" __declspec(dllexport)
#else
#define MODULE_API
#endif

/*
module entry api, need user implement
*/

/*module can use to get interfaces/functions/values from main module*/
typedef void* (*module_get_prop_function)(const char* name);

/** optional api for init module */
MODULE_API void* module_init(module_get_prop_function func);

/** dukopen_<modulename> for js require() */
// MODULE_API duk_ret_t dukopen_<modulename>(duk_context* ctx);  

