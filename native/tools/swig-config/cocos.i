%module(target_namespace="jsb") engine

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "core/data/Object.h"
#include "core/data/JSBNativeDataHolder.h"
#include "platform/interfaces/modules/canvas/CanvasRenderingContext2D.h"
#include "platform/interfaces/modules/Device.h"
#include "platform/FileUtils.h"
#include "platform/SAXParser.h"
#include "math/Vec2.h"
#include "math/Color.h"
#include "profiler/DebugRenderer.h"
%}

%{
#include "bindings/auto/jsb_cocos_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
%}

%rename(_destroy) cc::CCObject::destroy;
%rename(_destroyImmediate) cc::CCObject::destroyImmediate;

namespace cc {

// %rename(CanvasRenderingContext2D) ICanvasRenderingContext2D;
// %rename(CanvasGradient) ICanvasGradient;
%rename(PlistParser) SAXParser;

%ignore ICanvasRenderingContext2D::Delegate;
%ignore ICanvasRenderingContext2D::setCanvasBufferUpdatedCallback;
%ignore ICanvasRenderingContext2D::fillText;
%ignore ICanvasRenderingContext2D::strokeText;
%ignore ICanvasRenderingContext2D::fillRect;
%ignore ICanvasRenderingContext2D::measureText;

%ignore FileUtils::getFileData;
%ignore FileUtils::setFilenameLookupDictionary;
%ignore FileUtils::destroyInstance;
%ignore FileUtils::getFullPathCache;
%ignore FileUtils::getContents;
%ignore FileUtils::listFilesRecursively;
%ignore FileUtils::setDelegate;

%ignore Device::getDeviceMotionValue;

%ignore ResizableBuffer;

%ignore Vec2::compOp;

%ignore SAXDelegator;
%ignore SAXParser::parse(const char* xmlData, size_t dataLength);
%ignore SAXParser::setDelegator;
%ignore SAXParser::startElement;
%ignore SAXParser::endElement;
%ignore SAXParser::textHandler;

%ignore DebugRenderer::activate;
%ignore DebugRenderer::render;
%ignore DebugRenderer::destroy;

%ignore DebugFontInfo;

%ignore JSBNativeDataHolder::getData;
%ignore JSBNativeDataHolder::setData;

}

%attribute_writeonly(cc::ICanvasRenderingContext2D, float, width, setWidth);
%attribute_writeonly(cc::ICanvasRenderingContext2D, float, height, setHeight);
%attribute_writeonly(cc::ICanvasRenderingContext2D, float, lineWidth, setLineWidth);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, fillStyle, setFillStyle);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, font, setFont);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, globalCompositeOperation, setGlobalCompositeOperation);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, lineCap, setLineCap);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, strokeStyle, setStrokeStyle);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, lineJoin, setLineJoin);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, textAlign, setTextAlign);
%attribute_writeonly(cc::ICanvasRenderingContext2D, ccstd::string&, textBaseline, setTextBaseline);

%attribute(cc::CCObject, ccstd::string&, name, getName, setName);
%attribute(cc::CCObject, cc::CCObject::Flags, hideFlags, getHideFlags, setHideFlags);
%attribute(cc::CCObject, bool, replicated, isReplicated, setReplicated);
%attribute(cc::CCObject, bool, isValid, isValid);

%import "base/Macros.h"
%import "base/memory/Memory.h"
%import "base/Data.h"
%import "base/Value.h"

%import "math/MathBase.h"
%import "math/Geometry.h"
%import "math/Vec4.h"
%import "platform/interfaces/modules/IScreen.h"
%import "platform/interfaces/modules/ISystem.h"
%import "platform/interfaces/modules/INetwork.h"

%include "core/data/Object.h"
%include "core/data/JSBNativeDataHolder.h"

%include "platform/interfaces/modules/canvas/ICanvasRenderingContext2D.h"
%include "platform/interfaces/modules/canvas/CanvasRenderingContext2D.h"
%include "platform/interfaces/modules/Device.h"
%include "platform/FileUtils.h"
%include "platform/SAXParser.h"
%include "math/Vec2.h"
%include "math/Color.h"

%include "profiler/DebugRenderer.h"

