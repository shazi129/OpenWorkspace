Title: python代码段     
Date: 2015-11-10           
Category: 编程语言      
Tags: Python  

#Python代码段


[TOC]

下面总结一些日常Python代码段

##遍历文件夹

```python
#!Python
import os
def getAllFile(dirPath):
	ret = []
	allsub = os.listdir(dirPath)
	for sub in allsub:
		subPath = "%s/%s" % (dirPath, sub)
		if os.path.isfile(subPath):
			ret.append(subPath)
		if os.path.isdir(subPath):
			ret.extend(getAllFile(subPath))
	return ret
```

##打zip包

```python
#!Python
import zipfile, os

zipPakFile = zipfile.ZipFile(zipflieName, 'w' ,zipfile.ZIP_DEFLATED)
for item in fileList:
	zipPakFile.write(item) 
zipPakFile.close()
```

##删除文件夹

```python
#!Python
import shutil
#True表示即使为空也强制删除，如果不加True, 只能删除空文件夹
shutil.rmtree(dirPath, True) 
```

##创建文件夹

```python
#!Python
if not os.path.isdir(dir): 
    #makedirs和mkdir的区别是，如果父目录不存在，makedirs会创建父目录，而mkdir不会python
	os.makedirs(dir)  
```

##拷贝文件

```python
#!python
import os
import shutil
imageName = os.path.basename(image)
shutil.copy(image, "%s/%s" % (pelicanconf.OUTPUT_PATH, imageName))
```

##按编码转换字符串

```python
    def decode_bytes(byte_str, encoding):
        if len(encoding) > 0:
            return byte_str.decode(encoding)
        else:
            return byte_str
```

##运行命令

```python
    #encoding 为输出格式
    def execute_cmd(cmd, encoding=""):

        print(cmd)
        
        pipe = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        #实时读出一些数据
        while pipe.poll() == None:
            line_byte = pipe.stdout.readline()
            print(decode_bytes(line_byte, encoding), end="");

        out = pipe.stdout.read()
        if len(out) > 0:
            print(decode_bytes(out, encoding), end="");
                
        err = pipe.stderr.read()
        if len(err) > 0:
            raise Exception("execute cmd error:", decode_bytes(err, encoding))
```