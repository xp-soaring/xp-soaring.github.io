@echo off
if ".%1"=="." ..\bin\jdk1.3.1\bin\javac -target 1.1 igcview.java
if not ".%1"=="." ..\bin\jdk1.3.1\bin\javac -target 1.1 %1
