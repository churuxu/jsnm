# jsnm
javascript native module generator tool, support binding with duktape etc.

# 命令行说明
- 运行jsnm duktape，生成duktape模块的C++代码
- 运行jsnm node，生成node模块的C++代码 (TODO)
- 运行jsnm react-ios，生成react-native模块的Objective-C++代码 (TODO)
- 运行jsnm react-android，生成react-native模块的java代码 (TODO)

# 步骤
1. 创建idl目录，在idl目录下创建用于js中使用的接口声明文件
2. 运行jsnm xxx生成C++代码，包含一些.h文件和.hpp文件
3. 建project，编写.cpp文件实现.h中声明的接口
4. 按照不同js引擎模块的规范创建模块，并编译
5. js中通过require引用这个native模块，就可以调用idl中声明的接口


# 支持情况
- duktape
- node (TODO)
- react-native (TODO)

