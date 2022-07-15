%module(target_namespace="jsb") extension

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "extensions/cocos-ext.h"

%}

%{
#include "bindings/auto/jsb_extension_auto.h"
%}

%rename(AssetsManager) cc::extension::AssetsManagerEx;
%rename(EventAssetsManager) cc::extension::EventAssetsManagerEx;

%import "extensions/ExtensionExport.h"
%import "extensions/ExtensionMacros.h"

%include "extensions/assets-manager/EventAssetsManagerEx.h"
%include "extensions/assets-manager/Manifest.h"
%include "extensions/assets-manager/AssetsManagerEx.h"
