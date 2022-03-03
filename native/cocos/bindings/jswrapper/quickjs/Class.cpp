/****************************************************************************
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
****************************************************************************/

#include "Class.h"
#include "Object.h"
#include "ScriptEngine.h"
#include "Utils.h"

#if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS

namespace se {

namespace {

JSContext *          __cx = nullptr;
std::vector<Class *> __allClasses;

} // namespace

Class::Class() {
    memset(&_classOps, 0, sizeof(_classOps));

    __allClasses.push_back(this);
}

Class::~Class() {
}

Class *Class::create(const char *className, Object *obj, Object *parentProto, JSCFunction *ctor) {
    Class *cls = new Class();
    if (cls != nullptr && !cls->init(className, obj, parentProto, ctor)) {
        delete cls;
        cls = nullptr;
    }
    return cls;
}

Class *Class::create(const std::initializer_list<const char *> &classPath, se::Object *parent, Object *parentProto, JSCFunction *ctor) {
}

bool Class::init(const char *clsName, Object *parent, Object *parentProto, JSCFunction *ctor) {
    _name = clsName;

    JS_NewClassID(&_classId);
    JS_NewClass(JS_GetRuntime(__cx), _classId, &_classOps);

    _parent = parent;
    if (_parent != nullptr)
        _parent->incRef();

    _parentProto = parentProto;
    if (_parentProto != nullptr)
        _parentProto->incRef();

    _ctor = ctor;

    //        SE_LOGD("Class init ( %s ) ...\n", clsName);
    return true;
}

void Class::destroy() {
    SAFE_DEC_REF(_parent);
    SAFE_DEC_REF(_proto);
    SAFE_DEC_REF(_parentProto);
}

bool Class::install() {
    _proto = Object::createPlainObject();
    _proto->root();

    JS_SetPropertyFunctionList(__cx, _proto->_getJSObject(), _propertiesOrFuncs.data(), _propertiesOrFuncs.size());
    JSValue ctorVal = JS_NewCFunction2(__cx, _ctor, _name, 0, JS_CFUNC_constructor, 0);
    JS_SetConstructor(__cx, ctorVal, _proto->_getJSObject());
    JS_SetClassProto(__cx, _classId, _proto->_getJSObject());

    return true;
}

bool Class::defineFunction(const char *name, JSCFunction *func) {
    JSCFunctionListEntry cb = JS_CFUNC_DEF(name, 0, func);
    _propertiesOrFuncs.emplace_back(cb);
    return true;
}

bool Class::defineProperty(const char *name, JSPropGetter getter, JSPropSetter setter) {
    JSCFunctionListEntry cb = JS_CGETSET_DEF(name, getter, setter);
    _propertiesOrFuncs.emplace_back(cb);
    return true;
}

bool Class::defineProperty(const std::initializer_list<const char *> &names, JSPropGetter getter, JSPropSetter setter) {
    bool ret = true;
    for (const auto *name : names) {
        ret &= defineProperty(name, getter, setter);
    }
    return ret;
}

bool Class::defineStaticFunction(const char *name, JSCFunction *func) {
    JSCFunctionListEntry cb = JS_CFUNC_DEF(name, 0, func);
    _staticPropertiesOrStaticFuncs.emplace_back(cb);
    return true;
}

bool Class::defineStaticProperty(const char *name, JSPropGetter getter, JSPropSetter setter) {
    JSCFunctionListEntry cb = JS_CGETSET_DEF(name, getter, setter);
    _staticPropertiesOrStaticFuncs.emplace_back(cb);
    return true;
}

bool Class::defineFinalizeFunction(JSClassFinalizer func) {
    _finalizeOp = func;
    return true;
}

JSValue Class::_createJSObjectWithClass(Class *cls) {
}

void Class::setContext(JSContext *cx) {
    __cx = cx;
}

Object *Class::getProto() {
    return _proto;
}

JSClassFinalizer *Class::_getFinalizeCb() const {
    return _finalizeOp;
}

void Class::cleanup() {
    for (auto cls : __allClasses) {
        cls->destroy();
    }

    se::ScriptEngine::getInstance()->addAfterCleanupHook([]() {
        for (auto cls : __allClasses) {
            delete cls;
        }
        __allClasses.clear();
    });
}

} // namespace se

#endif // #if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS
