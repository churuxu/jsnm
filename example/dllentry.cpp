
#include "pch.h"
#include "gen/Foo.h"
#include "gen/Bar.h"
#include "gen/Static.h"
#include "gen/FooBinding.hpp"
#include "gen/BarBinding.hpp"
#include "gen/StaticBinding.hpp"
#include "gen/module_entry.h"

#pragma comment(lib,"../deps/duktape.lib")


/*
void* module_init(module_config* config) {
	if (config && config->log_) {
		config->log_("example module init");
	}
	return NULL;
}
*/
duk_ret_t dukopen_example(duk_context* ctx) {
	duk_push_object(ctx);
	duktape_init_Foo(ctx);
	duktape_init_Bar(ctx);
	duktape_init_Static(ctx);
	return 1;
}



