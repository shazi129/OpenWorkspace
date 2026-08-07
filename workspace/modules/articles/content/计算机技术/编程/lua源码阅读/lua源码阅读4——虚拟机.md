Title:lua源码阅读4——虚拟机   
Date: 2020-05-15 
Category: lua源码阅读     

[TOC]

## lua_State

```cpp
/*
** 'per thread' state  每个虚拟机线程的上下文
*/
struct lua_State {
  CommonHeader;
  unsigned short nci;  /* number of items in 'ci' list */
  lu_byte status;
  StkId top;  /* first free slot in the stack */

  //主线程上下文
  global_State *l_G;

  //当前调用的函数信息，lua认为所有代码都在一个函数中
  CallInfo *ci;  /* call info for current function */
  const Instruction *oldpc;  /* last pc traced */

  //数据栈
  StkId stack_last;  /* last free slot in the stack */
  StkId stack;  /* stack base */
  UpVal *openupval;  /* list of open upvalues in this stack */
  GCObject *gclist;
  struct lua_State *twups;  /* list of threads with open upvalues */
  struct lua_longjmp *errorJmp;  /* current error recover point */
  CallInfo base_ci;  /* CallInfo for first level (C calling Lua) */
  volatile lua_Hook hook;
  ptrdiff_t errfunc;  /* current error handling function (stack index) */
  int stacksize;
  int basehookcount;
  int hookcount;
  unsigned short nny;  /* number of non-yieldable calls in stack */
  unsigned short nCcalls;  /* number of nested C calls */
  l_signalT hookmask;
  lu_byte allowhook;
};

```

