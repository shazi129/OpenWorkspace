Title:lua源码阅读7——内存管理  
Date: 2020-06-04
Category: lua源码阅读 

[TOC]

## 内存申请和释放

Lua允许自定义内存的申请和释放的行为：

```cpp
LUALIB_API lua_State *luaL_newstate (void) {
  lua_State *L = lua_newstate(l_alloc, NULL); //设置内存申请和释放函数
  if (L) lua_atpanic(L, &panic);
  return L;
}
```

这个函数会被设置到`global_State->frealloc`字段中。 我们来看看默认的内存申请函数的内容：

```cpp
//虚拟机内部用到的内存申请和释放的函数， 当nSize=0时，释放内存
static void *l_alloc (void *ud, void *ptr, size_t osize, size_t nsize) {
  (void)ud; (void)osize;  /* not used */
  if (nsize == 0) {
    free(ptr);
    return NULL;
  }
  else
    return realloc(ptr, nsize);
}
```

在实际的使用中，申请和释放内存用得跟多的是这么些宏定义：

```cpp
#define luaM_freemem(L, b, s)	luaM_realloc_(L, (b), (s), 0)
#define luaM_free(L, b)		luaM_realloc_(L, (b), sizeof(*(b)), 0)
#define luaM_freearray(L, b, n)   luaM_realloc_(L, (b), (n)*sizeof(*(b)), 0)

#define luaM_malloc(L,s)	luaM_realloc_(L, NULL, 0, (s))

```

这些宏定义可以看作是对`luaM_realloc_`函数的封装：

```cpp
/*
** generic allocation routine.
** 对realloc的封装，block: 老内存快，osize： 老大小，nsize：新大小，返回新内存块
*/
void *luaM_realloc_ (lua_State *L, void *block, size_t osize, size_t nsize) {
  void *newblock;
  global_State *g = G(L);

  //参数检查：block = null时， osize必须为0， block != null osize必须不为0
  size_t realosize = (block) ? osize : 0;
  lua_assert((realosize == 0) == (block == NULL));
#if defined(HARDMEMTESTS)
  if (nsize > realosize && g->gcrunning)
    luaC_fullgc(L, 1);  /* force a GC whenever possible */
#endif

  //nsize==0的时候才释放, l_alloc中实现
  newblock = (*g->frealloc)(g->ud, block, osize, nsize);

  //申请失败，gc一次，然后再申请一次
  if (newblock == NULL && nsize > 0) {
    lua_assert(nsize > realosize);  /* cannot fail when shrinking a block */
    if (g->version) {  /* is state fully built? */
      luaC_fullgc(L, 1);  /* try to free some memory... */
      newblock = (*g->frealloc)(g->ud, block, osize, nsize);  /* try again */
    }
    if (newblock == NULL)
      luaD_throw(L, LUA_ERRMEM);
  }
  lua_assert((nsize == 0) == (newblock == NULL));
  g->GCdebt = (g->GCdebt + nsize) - realosize; //记录当前使用的内存大小
  return newblock;
}
```



## GC 算法

Lua中gc使用的是Mark and Sweep算法，大致的过程如下

1. 所有新创建的对象都是**白色**

2. 从根开始遍历，遍历到的标志成**灰色**

3. 将**灰色**置为**黑色**， 并把他们的引用置为**灰色**，重复2， 直至没有灰色
4. 回收**白色**

[动画描述：](https://en.wikipedia.org/wiki/Tracing_garbage_collection)

![动画描述](./Animation_of_tri-color_garbage_collection.gif)

在GC过程中，有些过程是可以中断的。例如2阶段时，又有新对象创建，它可能被黑色的变量引用。为了应对这些情况，lua增加了两种颜色：

1. **Other White**

   扫描完成后，新创建的对象为**Other White**。Ohter white本轮GC不清除，GC完成后，新建的对象都是Other White, 下一轮GC针对Other White清除。如此不断地切换。

2. **Gray Again**

   当标记过程中，创建一个被黑色引用的对象，那么将黑色置为**Gray Again**。Gray Again的东西会在灰色对象清空之后，使用原子操作变成黑色。



## GC相关结构

### CommonHeader

在Lua中，受gc管理的数据类型，例如TString, Table, Proto, lua_State等都有一个通用头：

```cpp
#define CommonHeader	GCObject *next; lu_byte tt; lu_byte marked
```

其中：

- `next`用于构成所有可gc对象的链表

- `tt`表明本个结构的数据类型

- `marked`用于表示在gc过程的标记的颜色

定义结构时，CommonHeader通常是第一个字段，那么就可以方便的把回收链表上的任意结构强转为任意结构。



### 颜色的一些宏定义

```cpp
//...
/* Layout for bit use in 'marked' field: */
//第0位表示white
#define WHITE0BIT	0  /* object is white (type 0) */ 
//第1位表示 other white
#define WHITE1BIT	1  /* object is white (type 1) */
//第2位表示黑色
#define BLACKBIT	2  /* object is black */
#define FINALIZEDBIT	3  /* object has been marked for finalization */
/* bit 7 is currently used by tests (luaL_checkmemory) */

#define WHITEBITS	bit2mask(WHITE0BIT, WHITE1BIT)

//颜色判断
#define iswhite(x)      testbits((x)->marked, WHITEBITS)
#define isblack(x)      testbit((x)->marked, BLACKBIT)
//不是白的，不是黑的,就是灰的
#define isgray(x)  /* neither white nor black */  \
	(!testbits((x)->marked, WHITEBITS | bitmask(BLACKBIT)))

#define tofinalize(x)	testbit((x)->marked, FINALIZEDBIT)

//获得other white， 异或操作，很精巧
#define otherwhite(g)	((g)->currentwhite ^ WHITEBITS)
#define isdeadm(ow,m)	(!(((m) ^ WHITEBITS) & (ow)))
#define isdead(g,v)	isdeadm(otherwhite(g), (v)->marked)

//两种white间切换
#define changewhite(x)	((x)->marked ^= WHITEBITS)
//...
```



### GC状态

Lua虚拟机中gc的状态主要保存在`global_State`中

```cpp
/*
** 'global state', shared by all threads of this state
*/
typedef struct global_State {
  lua_Alloc frealloc;  /* function to reallocate memory */
  void *ud;         /* auxiliary data to 'frealloc' */
  //正在使用的内存大小， 总大小-需要gc的大小
  l_mem totalbytes;  /* number of bytes currently allocated - GCdebt */
  //需要gc的大小
  l_mem GCdebt;  /* bytes allocated not yet compensated by the collector */
  //本次遍历收集的内存大小，可以将一次gc收集分成几次完成，使一次收集不占用太多时间
  lu_mem GCmemtrav;  /* memory traversed by the GC */
  lu_mem GCestimate;  /* an estimate of the non-garbage memory in use */
  stringtable strt;  /* hash table for strings */
  TValue l_registry;
  unsigned int seed;  /* randomized seed for hashes */

  //当前用的白色种类
  lu_byte currentwhite;
  //当前gc阶段，值有GCSpropagate，GCSatomic等
  lu_byte gcstate;  /* state of garbage collector */
  lu_byte gckind;  /* kind of GC running */
  lu_byte gcrunning;  /* true if GC is running */
  //所有可回收对象的列表，新创建的会放到头部，参看luaC_newobj
  GCObject *allgc;  /* list of all collectable objects */
  //当前sweep的进度
  GCObject **sweepgc;  /* current position of sweep in list */
  GCObject *finobj;  /* list of collectable objects with finalizers */
  //灰色列表
  GCObject *gray;  /* list of gray objects */
  //gray again 列表
  GCObject *grayagain;  /* list of objects to be traversed atomically */
  GCObject *weak;  /* list of tables with weak values */
  GCObject *ephemeron;  /* list of ephemeron tables (weak keys) */
  GCObject *allweak;  /* list of all-weak tables */
  GCObject *tobefnz;  /* list of userdata to be GC */
  GCObject *fixedgc;  /* list of objects not to be collected */
  struct lua_State *twups;  /* list of threads with open upvalues */
  unsigned int gcfinnum;  /* number of finalizers to call in each GC step */
  int gcpause;  /* size of pause between successive GCs */
  //一次收集的最大内存，和GCmemtrav配合使用
  int gcstepmul;  /* GC 'granularity' */
  lua_CFunction panic;  /* to be called in unprotected errors */
  struct lua_State *mainthread;
  const lua_Number *version;  /* pointer to version number */
  TString *memerrmsg;  /* memory-error message */
  TString *tmname[TM_N];  /* array with tag-method names */
  struct Table *mt[LUA_NUMTAGS];  /* metatables for basic types */
  TString *strcache[STRCACHE_N][STRCACHE_M];  /* cache for strings in API */
} global_State;
```



```cpp
#define GCSpropagate	0  //遍历阶段
#define GCSatomic	1
#define GCSswpallgc	2
#define GCSswpfinobj	3
#define GCSswptobefnz	4
#define GCSswpend	5
#define GCScallfin	6
#define GCSpause	7
```

## GC逻辑

### 自动GC

在lua虚拟机中，在导致内存增长的操作中，会自动执行GC, 例如

```cpp
//lvm.c
vmcase(OP_NEWTABLE) {
    int b = GETARG_B(i);
    int c = GETARG_C(i);
    Table *t = luaH_new(L);
    sethvalue(L, ra, t);
    if (b != 0 || c != 0)
        luaH_resize(L, t, luaO_fb2int(b), luaO_fb2int(c));
    checkGC(L, ra + 1); //检查并gc
    vmbreak;
}
```

`checkGC`实际是调用：

```cpp
#define luaC_condGC(L,pre,pos) \
	{ if (G(L)->GCdebt > 0) { pre; luaC_step(L); pos;}; \
	  condchangemem(L,pre,pos); }
```

当`global->GCdebt`标志大于0时，会触发一次GC

### luaC_step

```cpp
/*
** performs a basic GC step when collector is running
*/
void luaC_step (lua_State *L) {
  global_State *g = G(L);
  //获取出来的debt是g->gcstepmul的倍数， debt >= 0
  l_mem debt = getdebt(g);  /* GC deficit (be paid now) */
  if (!g->gcrunning) {  /* not running? */
	//设置debt为10倍平常值，这样可以防止频繁的自动GC
    luaE_setdebt(g, -GCSTEPSIZE * 10);  /* avoid being called too often */
    return;
  }

  //如果要gc的内存小于debt+GCSTEPSIZE， 这个循环一次性处理完
  do {  /* repeat until pause or enough "credit" (negative debt) */
    lu_mem work = singlestep(L);  /* perform one single step */
    debt -= work;
  }
  //g->gcstate的初始状态是GCSpause，如果又等于GCSpause的话，表示gc又处理过一轮了
  while (debt > -GCSTEPSIZE && g->gcstate != GCSpause);

  //本轮处理完了，重新设置pause状态
  if (g->gcstate == GCSpause)
    setpause(g);  /* pause until next cycle */
  else {
    debt = (debt / g->gcstepmul) * STEPMULADJ;  /* convert 'work units' to Kb */
    luaE_setdebt(g, debt);
    runafewfinalizers(L);
  }
}
```

这里主要说一下`setpause`, 它的功能主要是在gc完成之后，设置下一次gc的时机。假设某次gc完成后，未回收的的内存有1k， 那么`totalbytes`=2k , `debt=-1k`， 即自动回收门槛增加了一倍。如果在调用栈比较深的地方触发自动gc， 很多临时变量不能被正确的mark, 那么这个自动回收的门槛值也会变大。

