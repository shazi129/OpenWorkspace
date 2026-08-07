Title:lua源码阅读1——源码编译    
Date: 2019-03-13  
Category: lua源码阅读     



1. 下载 lua源码

   源码地址：http://www.lua.org/versions.html， 本次阅读使用的版本是5.3.5

2. 将src文件夹导入vs， 我使用的是vs2015。除了lua.c和luac.c全部include进工程。

3. 编译。我的工程地址：https://github.com/shazi129/LuaSourceCode.git



这里是我的测试代码：

```c
#include <stdio.h>
#include "./../src/lua.h"

int main()
{
	char lua[] = 
		"local a = 1 \n"\
		"local b = 2 \n"\
		"print (string.format(\"a+b=%d\", a+b))";

	lua_State * lstate = luaL_newstate();
	luaL_openlibs(lstate);

	if (luaL_loadstring(lstate, lua) || lua_pcall(lstate, 0, 0, 0))
	{
		printf("error:  %s\n", lua_tostring(lstate, -1));
	}

	lua_close(lstate);
	system("pause");
	return 0;
}
```







