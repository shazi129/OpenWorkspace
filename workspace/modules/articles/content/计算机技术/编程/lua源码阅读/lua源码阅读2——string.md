Title:lua源码阅读2——string  
Date: 2019-03-13  
Category: lua源码阅读     

[TOC]

## 字符串部分对外接口

```c
//计算一段buff的哈希值
LUAI_FUNC unsigned int luaS_hash (const char *str, size_t l, unsigned int seed);
//计算长字符串的哈希值
LUAI_FUNC unsigned int luaS_hashlongstr (TString *ts);
//比较字长符串
LUAI_FUNC int luaS_eqlngstr (TString *a, TString *b);
//重新分配散列桶的大小
LUAI_FUNC void luaS_resize (lua_State *L, int newsize);
//清理字符串的cache
LUAI_FUNC void luaS_clearcache (global_State *g);
//初始化短字符散列表和长字符cache
LUAI_FUNC void luaS_init (lua_State *L);
//删除一个短字符串
LUAI_FUNC void luaS_remove (lua_State *L, TString *ts);
//创建字符串
LUAI_FUNC TString *luaS_newlstr (lua_State *L, const char *str, size_t l);
//创建字符串，先从所以中找，然后luaS_newlstr创建
LUAI_FUNC TString *luaS_new (lua_State *L, const char *str);
//创建长字符串
LUAI_FUNC TString *luaS_createlngstrobj (lua_State *L, size_t l);
```



## 字符串的结构体

```c
/*
** Header for string value; string bytes follow the end of this structure
** (aligned according to 'UTString'; see next).
*/
typedef struct TString {
  CommonHeader;
  //标识是否是lua关键字，长字符串是否哈希等信息
  lu_byte extra;  /* reserved words for short strings; "has hash" for longs */
  //短字符串的长度
  lu_byte shrlen;  /* length for short strings */
  //字符串哈希值
  unsigned int hash;
  //短字符串才有链表，所以用可以用union表示两种信息
  union {
    //长字符串的长度
    size_t lnglen;  /* length for long strings */
    //短字符串的链表(一个链表的字符串哈希值都相同)
    struct TString *hnext;  /* linked list for hash table */
  } u;
} TString;
```
在创建字符串时，会申请`sizeof(TString) + 字符串实际长度 + 1`的内存空间，头部存`TString`,后面跟着字符串内容。 

### 长字符串和短字符串

Lua 5.3引入了长字符串和短字符串的概念，它们按长度区分，定义在：

```c
/*
** Maximum length for short strings, that is, strings that are
** internalized. (Cannot be smaller than reserved words or tags for
** metamethods, as these strings must be internalized;
** #("function") = 8, #("__newindex") = 10.)
*/
#if !defined(LUAI_MAXSHORTLEN)
#define LUAI_MAXSHORTLEN	40
#endif
```

Lua中所有关键词都被认为是短字符串，最长的应该是"__newindex"，所以`LUAI_MAXSHORTLEN`不应小于10。

 Lua中所有的短字符串均被存放在全局状态表（global_State）的**strt**域中，**strt**是**stringtable**的简写，它是一个哈希表。



### 短字符串的组织方式

 Lua中所有的短字符串均被存放在全局状态表（global_State）的`strt`域中，`strt`是`stringtable`的简写，它是一个哈希表。`strt`的定义：

```c
typedef struct stringtable {
  TString **hash;
  int nuse;  //表里的字符串的个数
  int size; //size是这个表的散列桶的个数
} stringtable;
```

表的结构如下图(参考：https://www.cnblogs.com/heartchord/p/4561308.html)：


![img](https://images0.cnblogs.com/blog2015/526315/201506/181821271542574.png)

在Lua初始化的时候会调用`luaS_init`来初始化短字符串的哈希表。




## 字符串索引初始化

```c
/*
** Initialize the string table and the string cache
*/
void luaS_init (lua_State *L) {
  global_State *g = G(L);
  int i, j;
  //创建短字符串的散列表
  luaS_resize(L, MINSTRTABSIZE);  /* initial size of string table */

  /* pre-create memory-error message */
  g->memerrmsg = luaS_newliteral(L, MEMERRMSG);
  luaC_fix(L, obj2gco(g->memerrmsg));  /* it should never be collected */

  //字符串缓冲，用于提高字符串的访问。STRCACHE_N为索引的个数,STRCACHE_M为有相同索引元素的个数
  for (i = 0; i < STRCACHE_N; i++)  /* fill cache with valid strings */
    for (j = 0; j < STRCACHE_M; j++)
      g->strcache[i][j] = g->memerrmsg;
}
```
### 短字符串散列表的建立

```c
/*
** resizes the string table
*/
void luaS_resize (lua_State *L, int newsize) {
  int i;
  stringtable *tb = &G(L)->strt;
  if (newsize > tb->size) {  /* grow table if needed */
      
    //将tb->hash的数量从tb->size增加到newsize
    luaM_reallocvector(L, tb->hash, tb->size, newsize, TString *);
    for (i = tb->size; i < newsize; i++)
      //新创建的初始值为NULL
      tb->hash[i] = NULL;
  }
  
  for (i = 0; i < tb->size; i++) {  /* rehash */
    TString *p = tb->hash[i];
    tb->hash[i] = NULL;
    while (p) {  /* for each node in the list */
      /*
	   * 这段是这样处理的
	   * 初始：
	   * p -> [1] ->[2] -> [3]
	   * h -> [5] ->[6] -> [7]
	   * 处理后
	   * p ->[2] -> [3]
	   * h ->[1] -> [5] ->[6] -> [7]
	   */
      TString *hnext = p->u.hnext;  /* save next */
      unsigned int h = lmod(p->hash, newsize);  /* new position */
      p->u.hnext = tb->hash[h];  /* chain it */
      tb->hash[h] = p;
      p = hnext;
    }
  }
  //假如是缩表, 因为经过上面的处理，后面的桶肯定是空了
  if (newsize < tb->size) {  /* shrink table if needed */
    /* vanishing slice should be empty */
    lua_assert(tb->hash[newsize] == NULL && tb->hash[tb->size - 1] == NULL);
    luaM_reallocvector(L, tb->hash, tb->size, newsize, TString *);
  }
  tb->size = newsize;
}
```
###字符串哈希算法

```c
/*
** Lua will use at most ~(2^LUAI_HASHLIMIT) bytes from a string to
** compute its hash
*/
#if !defined(LUAI_HASHLIMIT)
#define LUAI_HASHLIMIT		5
#endif

unsigned int luaS_hash (const char *str, size_t l, unsigned int seed) {
  unsigned int h = seed ^ cast(unsigned int, l);
  size_t step = (l >> LUAI_HASHLIMIT) + 1;
  for (; l >= step; l -= step)
    h ^= ((h<<5) + (h>>2) + cast_byte(str[l - 1]));
  return h;
}
```

- `LUAI_HASHLIMIT`算哈希值的最多的字节数，5表示32，主要用来获得计算步长`step`。c语言中常用位移来代替乘除用以提高效率(参考二进制的位移和乘除运算)。实际就是:`step = 字符串长度 / 32 + 1`
- 一些常见的哈希算法https://blog.csdn.net/chenguolinblog/article/details/7833794
- Lua中使用了随机生成的`seed`来保证哈希值不被猜测

### 长字符串的哈希算法

```c
unsigned int luaS_hashlongstr (TString *ts) {
  lua_assert(ts->tt == LUA_TLNGSTR);
  if (ts->extra == 0) {  /* no hash? */
    //作为参数传进去的ts->hash就是随机种子
    ts->hash = luaS_hash(getstr(ts), ts->u.lnglen, ts->hash);
    ts->extra = 1;  /* now it has its hash */
  }
  return ts->hash;
}
```

### 随机数种子seed

Lua中生成随机数种子的逻辑：

```c
/*
** a macro to help the creation of a unique random seed when a state is
** created; the seed is used to randomize hashes.
*/
#if !defined(luai_makeseed)
#include <time.h>
#define luai_makeseed()		cast(unsigned int, time(NULL))
#endif

/*
** Compute an initial seed as random as possible. Rely on Address Space
** Layout Randomization (if present) to increase randomness..
*/
#define addbuff(b,p,e) \
  { size_t t = cast(size_t, e); \
    memcpy(b + p, &t, sizeof(t)); p += sizeof(t); }

static unsigned int makeseed (lua_State *L) {
  char buff[4 * sizeof(size_t)];
  unsigned int h = luai_makeseed();
  int p = 0;
  //在这buff中写入各种变量的地址
  addbuff(buff, p, L);  /* heap variable */
  addbuff(buff, p, &h);  /* local variable */
  addbuff(buff, p, luaO_nilobject);  /* global variable */
  addbuff(buff, p, &lua_newstate);  /* public function */
  lua_assert(p == sizeof(buff));
  return luaS_hash(buff, p, h);
}
```

- `luai_makeseed` 返回当前时间戳
- 算法以当前时间戳为种子，哈希一段存了各种地址的buff，以得到的哈希值为随机数种子。如果在调试的时候想得到固定一致的哈希值，可以自定义`luai_makeseed`函数

##字符串的创建

###创建入口

```c
/*
** Create or reuse a zero-terminated string, first checking in the
** cache (using the string address as a key). The cache can contain
** only zero-terminated strings, so it is safe to use 'strcmp' to
** check hits.
*/
TString *luaS_new (lua_State *L, const char *str) {

  //先在缓冲中找，缓冲以字符串地址为索引，最多有STRCACHE_N(53)个索引
  unsigned int i = point2uint(str) % STRCACHE_N;  /* hash */
  int j;
  TString **p = G(L)->strcache[i];

  //每个索引下可以有STRCACHE_M(2)个字符串，命中后直接返回
  for (j = 0; j < STRCACHE_M; j++) {
    if (strcmp(str, getstr(p[j])) == 0)  /* hit? */
      return p[j];  /* that is it */
  }

  //没在缓冲中找到的话，在使用常规的方法查找或是创建字符串，得到字符串后，放到缓冲中
  /* normal route */
  for (j = STRCACHE_M - 1; j > 0; j--)
    p[j] = p[j - 1];  /* move out last element */
  /* new element is first in the list */
  p[0] = luaS_newlstr(L, str, strlen(str));
  return p[0];
}
```

创建字符串时，先通过缓冲查找，可以避免一些重复字符串的创建。

###创建字符串。

```c
/*
** new string (with explicit length)
*/
TString *luaS_newlstr (lua_State *L, const char *str, size_t l) {
  //根据字符串长度来创建
  if (l <= LUAI_MAXSHORTLEN)  /* short string? */
    return internshrstr(L, str, l); //创建短字符串
  else {
    TString *ts;
    if (l >= (MAX_SIZE - sizeof(TString))/sizeof(char))
      luaM_toobig(L);
    ts = luaS_createlngstrobj(L, l); //创建长字符串
    memcpy(getstr(ts), str, l * sizeof(char));
    return ts;
  }
}
```


### 长字符串的创建

```c
TString *luaS_createlngstrobj (lua_State *L, size_t l) {
  //长字符串在创建时，并没有计算哈希值，要作为索引用的时候才哈希
  TString *ts = createstrobj(L, l, LUA_TLNGSTR, G(L)->seed);
  ts->u.lnglen = l;
  return ts;
}
```


### 短字符串创建

```c
/*
** checks whether short string exists and reuses it or creates a new one
*/
static TString *internshrstr (lua_State *L, const char *str, size_t l) {
  TString *ts;
  global_State *g = G(L);
  unsigned int h = luaS_hash(str, l, g->seed);
  TString **list = &g->strt.hash[lmod(h, g->strt.size)];
  lua_assert(str != NULL);  /* otherwise 'memcmp'/'memcpy' are undefined */

  //先从列表中找，找到后直接返回
  for (ts = *list; ts != NULL; ts = ts->u.hnext) {
    if (l == ts->shrlen &&
        (memcmp(str, getstr(ts), l * sizeof(char)) == 0)) {
      /* found! */
      if (isdead(g, ts))  /* dead (but not collected yet)? */
        changewhite(ts);  /* resurrect it */
      return ts;
    }
  }

  //如果元素的个数太多了，就要重新生成散列桶
  if (g->strt.nuse >= g->strt.size && g->strt.size <= MAX_INT/2) {
    luaS_resize(L, g->strt.size * 2);
    list = &g->strt.hash[lmod(h, g->strt.size)];  /* recompute with new size */
  }
    
  //申请内存并创建结构体，组织方式： |TString结构体|l+1长的buff|
  ts = createstrobj(L, l, LUA_TSHRSTR, h);
  memcpy(getstr(ts), str, l * sizeof(char));
  ts->shrlen = cast_byte(l);
  ts->u.hnext = *list;
  *list = ts;
  g->strt.nuse++;
  return ts;
}

```
###通用创建过程：
可以发现，长字符串和短字符串都是通过`createstrobj`函数来创建的。
```c
/*
** creates a new string object
*/
static TString *createstrobj (lua_State *L, size_t l, int tag, unsigned int h) {
  TString *ts;
  GCObject *o;
  size_t totalsize;  /* total size of TString object */
  ////totalsize = sizeof(TString) + l + 1, 多加的1为了存储\0
  totalsize = sizelstring(l);
  o = luaC_newobj(L, tag, totalsize);
  ts = gco2ts(o);
  ts->hash = h;
  ts->extra = 0;
  getstr(ts)[l] = '\0';  /* ending 0 */
  return ts;
}
```

##短字符串的删除

```c
void luaS_remove (lua_State *L, TString *ts) {
  stringtable *tb = &G(L)->strt;
  TString **p = &tb->hash[lmod(ts->hash, tb->size)];
  while (*p != ts)  /* find previous element */
    p = &(*p)->u.hnext;
  //直接从列表里摘出来，并不释放
  *p = (*p)->u.hnext;  /* remove element from its list */
  tb->nuse--;
}
```

##字符串比较

Lua中使用`luaV_equalobj`来比较两个对象：

```c
/*
** Main operation for equality of Lua values; return 't1 == t2'.
** L == NULL means raw equality (no metamethods)
*/
int luaV_equalobj (lua_State *L, const TValue *t1, const TValue *t2) {
  ...
  /* values have same type and same variant */
  switch (ttype(t1)) {
    ...
    case LUA_TSHRSTR: return eqshrstr(tsvalue(t1), tsvalue(t2));
    case LUA_TLNGSTR: return luaS_eqlngstr(tsvalue(t1), tsvalue(t2));
    ...
  }
  ...
}
```

对于短字符串：

```c
/*
** equality for short strings, which are always internalized
*/
#define eqshrstr(a,b)	check_exp((a)->tt == LUA_TSHRSTR, (a) == (b))
```

直接判断他们的地址是否相同。

对于长字符串

```c
/*
** equality for long strings
*/
int luaS_eqlngstr (TString *a, TString *b) {
  size_t len = a->u.lnglen;
  lua_assert(a->tt == LUA_TLNGSTR && b->tt == LUA_TLNGSTR);
  return (a == b) ||  /* same instance or... */
    ((len == b->u.lnglen) &&  /* equal length and ... */ //先比较长度可以加快判断
     (memcmp(getstr(a), getstr(b), len) == 0));  /* equal contents */
}
```

相等的条件是：地址相同或者内容相同。