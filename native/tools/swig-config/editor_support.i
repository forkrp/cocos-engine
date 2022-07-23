%module(target_namespace="middleware") editor_support

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "editor-support/middleware-adapter.h"
#include "editor-support/MiddlewareManager.h"
#include "editor-support/SharedBufferManager.h"

%}

%{
#include "bindings/auto/jsb_editor_support_auto.h"
%}

%ignore cc::middleware::MiddlewareManager::addTimer;
%ignore cc::middleware::MiddlewareManager::removeTimer;
%ignore cc::middleware::MiddlewareManager::getMeshBuffer;
%ignore cc::middleware::SharedBufferManager::getBuffer;
%ignore cc::middleware::SharedBufferManager::reset;
%ignore cc::middleware::Texture2D::setTexParameters;

%import "editor-support/MiddlewareMacro.h"
%import "editor-support/MeshBuffer.h"

%include "editor-support/middleware-adapter.h"
%include "editor-support/SharedBufferManager.h"
%include "editor-support/MiddlewareManager.h"

