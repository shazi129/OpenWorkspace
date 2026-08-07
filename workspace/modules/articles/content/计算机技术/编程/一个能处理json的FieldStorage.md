Title: 一个能处理json的FieldStorage        
Date: 2012-11-02           
Category: 编程语言      
Tags: Python  

#一个能处理json的FieldStorage   

@(编程语言)[python]

一般的，FieldStorage是不能处理Json请求的，这里可以改写它的一个方法，使其具备接收json请求的能力。

	#!/usr/bin/env python
	#encoding:utf-8

	import cgi
	import urlparse
	import json
	import os
	
	class JSONFieldStorage(cgi.FieldStorage, object):
	"""
	FieldStorage类的改写，使其具有接收json的能力
	 """
	    def read_urlencoded(self):
	        """Internal: read data in query string format."""
	        qs = self.fp.read(self.length)
	        try:
	            self._json = json.loads(qs)
	        except Exception, e:
	            self._json = None
	        if self._json == None:
	            try:
	                self._json = json.loads(self.qs_on_post)
	            except:
	                self._json = None
	        if self.qs_on_post:
	            qs += '&' + self.qs_on_post
	        self.list = list = []
	        for key, value in urlparse.parse_qsl(qs, self.keep_blank_values,
	                                           self.strict_parsing):
	            list.append(cgi.MiniFieldStorage(key, value))
	        self.skip_lines()
	    def getJson(self):
	        try:
	            return self._json
	        except:
	            return None



使用方法和FieldStorage一致，要得到json请求时只需要调用getJson即可