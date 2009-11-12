Crowd Factory Javascript Toolkits
Distributed under an MIT license:

Copyright (c) 2009 Crowd Factory, Ian Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Build Instructions

We use apache ant and java to compile the source scripts that live in the /src folder.  To create your
own build, follow the instructions below. 

1. Install Java 
	http://www.java.com/en/download/index.jsp
2. Install Apache Ant (1.7+ recommended)
    http://ant.apache.org
	Install instructions are at http://ant.apache.org/manual/index.html
	Make sure you add ant to your path and set your ANT_HOME environment variable.
3. Get the toolkits:
	Two ways:
	A. Check out with git
	   git clone git://github.com/ianbtaylor/Crowd-Factory-JS-Toolkit.git 
    B. Download a zip from github
       http://github.com/ianbtaylor/Crowd-Factory-JS-Toolkit
       Click the download link, and extract the compressed file to a folder on your machine
4. Using the command line, navigate to your Crowd-Factory-JS-Toolkit folder from the command line and type the word "ant" and press return.
5. The ant script will compile and compress the JavaScript.
   The resulting compiled javascript will be placed in the build folder.






