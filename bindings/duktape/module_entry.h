#pragma once

#ifdef _MSC_VER
#define MODULE_API extern "C" __declspec(dllexport)
#else
#define MODULE_API
#endif

/*
module entry api, need user implement
*/


typedef void (*module_log_function)(const char* msg);
typedef void (*module_callback_function)(void* udata);
typedef void (*module_callback_runner)(module_callback_function func, void* udata);


typedef struct module_config{
	module_callback_runner runner_; //module can use this field to run callback at main thread
	module_log_function log_; //module can use this field to write log
}module_config;

typedef void* (*module_init_function)(module_config* config);

/** optional api for init module */
MODULE_API void* module_init(module_config* config);

/** dukopen_<modulename> for js require() */
// MODULE_API duk_ret_t dukopen_<modulename>(duk_context* ctx);  

