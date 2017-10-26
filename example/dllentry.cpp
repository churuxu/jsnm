
#include "pch.h"
#include "gen/Foo.h"
#include "gen/Bar.h"
#include "gen/Static.h"
#include "gen/FooBinding.hpp"
#include "gen/BarBinding.hpp"
#include "gen/StaticBinding.hpp"


#pragma comment(lib,"../deps/duktape.lib")


extern "C" __declspec(dllexport) duk_ret_t dukopen_example(duk_context* ctx) {
	duk_push_object(ctx);
	duktape_init_Foo(ctx);
	duktape_init_Bar(ctx);
	duktape_init_Static(ctx);
	return 1;
}


