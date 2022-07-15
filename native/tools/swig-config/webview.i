%module(target_namespace="jsb") webview

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "ui/webview/WebView.h"

%}

%{
#include "bindings/auto/jsb_webview_auto.h"
%}

%include "ui/webview/WebView.h"
