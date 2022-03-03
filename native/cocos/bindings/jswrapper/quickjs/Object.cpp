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

#include "Object.h"

#if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS

    #include "../MappingUtils.h"
    #include "Class.h"
    #include "ScriptEngine.h"
    #include "Utils.h"

namespace se {

std::unordered_map<Object *, void *> __objectMap; // Currently, the value `void*` is always nullptr

namespace {
JSContext *__cx = nullptr;
} // namespace

Object::Object() {
    _currentVMId = ScriptEngine::getInstance()->getVMId();
}

Object::~Object() {
    if (_cls == nullptr) {
        unroot();
    }

    if (_rootCount > 0) {
        unprotect();
    }

    auto iter = __objectMap.find(this);
    if (iter != __objectMap.end()) {
        __objectMap.erase(iter);
    }
}

bool Object::init(Class *cls, JSValue obj) {
    _cls  = cls;
    _obj = obj;

    assert(__objectMap.find(this) == __objectMap.end());
    __objectMap.emplace(this, nullptr);

    if (_cls == nullptr) {
        root();
    }

    return true;
}

Object *Object::_createJSObject(Class *cls, JSValue obj) {
    Object *ret = new Object();
    if (!ret->init(cls, obj)) {
        delete ret;
        ret = nullptr;
    }

    return ret;
}

Object *Object::_createJSObjectForConstructor(Class *cls, JSValueConst *args) {
    Object *ret = new Object();

    JSValue obj = JS_NewObjectProtoClass(__cx, cls->getProto()->_getJSObject(), cls->_classId);
    if (!ret->init(cls, obj)) {
        delete ret;
        ret = nullptr;
    }
    return ret;
}

Object *Object::createPlainObject() {
    Object *obj = Object::_createJSObject(nullptr, JS_NewObject(__cx));
    return obj;
}

Object *Object::createObjectWithClass(Class *cls) {
    JSValue jsobj = Class::_createJSObjectWithClass(cls);
    Object *  obj   = Object::_createJSObject(cls, jsobj);
    return obj;
}

Object *Object::getObjectWithPtr(void *ptr) {
    Object *obj  = nullptr;
    auto    iter = NativePtrToObjectMap::find(ptr);
    if (iter != NativePtrToObjectMap::end()) {
        obj = iter->second;
        obj->incRef();
    }
    return obj;
}

Object *Object::createArrayObject(size_t length) {
    JSValue jsobj = JS_NewArray(__cx);
    for (size_t i = 0; i < length; ++i) {
        JS_SetPropertyUint32(__cx, jsobj, i, JS_UNDEFINED);
    }
    Object *         obj = Object::_createJSObject(nullptr, jsobj);
    return obj;
}

Object *Object::createArrayBufferObject(const void *data, size_t byteLength) {
    Object* obj = nullptr;

//    if (byteLength > 0 && data != nullptr)
//    {
//        mozilla::UniquePtr<uint8_t[], JS::FreePolicy> jsBuf(
//            js_pod_arena_malloc<uint8_t>(js::ArrayBufferContentsArena, byteLength)
//        );
//        if (!jsBuf)
//            return nullptr;
//
//        memcpy(jsBuf.get(), data, byteLength);
//        JS::RootedObject jsobj(__cx, JS::NewArrayBufferWithContents(__cx, byteLength, jsBuf.get()));
//        if (jsobj)
//        {
//            // If JS::NewArrayBufferWithContents returns non-null, the ownership of
//            // the data is transfered to obj, so we release the ownership here.
//            mozilla::Unused << jsBuf.release();
//
//            obj = Object::_createJSObject(nullptr, jsobj);
//        }
//    }
//    else
//    {
//        JS::RootedObject jsobj(__cx, JS::NewArrayBuffer(__cx, byteLength));
//        if (jsobj)
//        {
//            obj = Object::_createJSObject(nullptr, jsobj);
//        }
//    }

    return obj;
}

/* static */
Object *Object::createExternalArrayBufferObject(void* contents, size_t byteLength, BufferContentsFreeFunc freeFunc, void* freeUserData/* = nullptr*/) {
    struct BackingStoreUserData {
        BufferContentsFreeFunc freeFunc;
        void* freeUserData;
        size_t byteLength;
    };

    auto* userData = new BackingStoreUserData();
    userData->freeFunc = freeFunc;
    userData->freeUserData = freeUserData;
    userData->byteLength = byteLength;

    Object* obj = nullptr;
//    JS::RootedObject jsobj(__cx, JS::NewExternalArrayBuffer(
//        __cx, byteLength, contents,
//        [](void* data, void* deleterData) {
//            auto* userData = reinterpret_cast<BackingStoreUserData*>(deleterData);
//            userData->freeFunc(data, userData->byteLength, userData->freeUserData);
//            delete userData;
//        },
//        userData)
//    );
//    if (jsobj)
//    {
//        obj = Object::_createJSObject(nullptr, jsobj);
//    }
    return obj;
}

Object *Object::createTypedArray(TypedArrayType type, const void *data, size_t byteLength) {
    if (type == TypedArrayType::NONE) {
        SE_LOGE("Don't pass se::Object::TypedArrayType::NONE to createTypedArray API!");
        return nullptr;
    }

    if (type == TypedArrayType::UINT8_CLAMPED) {
        SE_LOGE("Doesn't support to create Uint8ClampedArray with Object::createTypedArray API!");
        return nullptr;
    }


#define CREATE_TYPEDARRAY(_type_, _data, _byteLength, count) { \
        void* tmpData = nullptr; \
        JS::RootedObject arr(__cx, JS_New##_type_##Array(__cx, (uint32_t)(count))); \
        bool isShared = false; \
        if (_data != nullptr) { \
            JS::AutoCheckCannotGC nogc; \
            tmpData = JS_Get##_type_##ArrayData(arr, &isShared, nogc); \
            memcpy(tmpData, (const void*)_data, (_byteLength)); \
        } \
        Object* obj = Object::_createJSObject(nullptr, arr); \
        return obj; }

//        switch (type) {
//            case TypedArrayType::INT8:
//                CREATE_TYPEDARRAY(Int8, data, byteLength, byteLength);
//            case TypedArrayType::INT16:
//                CREATE_TYPEDARRAY(Int16, data, byteLength, byteLength/2);
//            case TypedArrayType::INT32:
//                CREATE_TYPEDARRAY(Int32, data, byteLength, byteLength/4);
//            case TypedArrayType::UINT8:
//                CREATE_TYPEDARRAY(Uint8, data, byteLength, byteLength);
//            case TypedArrayType::UINT16:
//                CREATE_TYPEDARRAY(Uint16, data, byteLength, byteLength/2);
//            case TypedArrayType::UINT32:
//                CREATE_TYPEDARRAY(Uint32, data, byteLength, byteLength/4);
//            case TypedArrayType::FLOAT32:
//                CREATE_TYPEDARRAY(Float32, data, byteLength, byteLength/4);
//            case TypedArrayType::FLOAT64:
//                CREATE_TYPEDARRAY(Float64, data, byteLength, byteLength/8);
//            default:
//                assert(false); // Should never go here.
//                break;
//        }

        return nullptr;
#undef CREATE_TYPEDARRAY
}

/* static */
Object *Object::createTypedArrayWithBuffer(TypedArrayType type, const Object *obj) {
    return Object::createTypedArrayWithBuffer(type, obj, 0);
}

/* static */
Object *Object::createTypedArrayWithBuffer(TypedArrayType type, const Object *obj, size_t offset) {
    size_t   byteLength{0};
    uint8_t *skip{nullptr};
    obj->getTypedArrayData(&skip, &byteLength);
    return Object::createTypedArrayWithBuffer(type, obj, offset, byteLength - offset);
}

/* static */
Object *Object::createTypedArrayWithBuffer(TypedArrayType type, const Object *obj, size_t offset, size_t byteLength) {
    if (type == TypedArrayType::NONE) {
        SE_LOGE("Don't pass se::Object::TypedArrayType::NONE to createTypedArray API!");
        return nullptr;
    }

    if (type == TypedArrayType::UINT8_CLAMPED) {
        SE_LOGE("Doesn't support to create Uint8ClampedArray with Object::createTypedArray API!");
        return nullptr;
    }

    assert(obj->isArrayBuffer());
//    JS::RootedObject jsobj(__cx, obj->_getJSObject());
//
//    switch (type) {
//        case TypedArrayType::INT8: {
//            JS::RootedObject typeArray(__cx, JS_NewInt8ArrayWithBuffer(__cx, jsobj, offset, byteLength));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::INT16: {
//            JS::RootedObject typeArray(__cx, JS_NewInt16ArrayWithBuffer(__cx, jsobj, offset, byteLength / 2));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::INT32: {
//            JS::RootedObject typeArray(__cx, JS_NewInt32ArrayWithBuffer(__cx, jsobj, offset, byteLength / 4));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::UINT8: {
//            JS::RootedObject typeArray(__cx, JS_NewUint8ArrayWithBuffer(__cx, jsobj, offset, byteLength));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::UINT16: {
//            JS::RootedObject typeArray(__cx, JS_NewUint16ArrayWithBuffer(__cx, jsobj, offset, byteLength / 2));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::UINT32: {
//            JS::RootedObject typeArray(__cx, JS_NewUint32ArrayWithBuffer(__cx, jsobj, offset, byteLength / 4));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::FLOAT32: {
//            JS::RootedObject typeArray(__cx, JS_NewFloat32ArrayWithBuffer(__cx, jsobj, offset, byteLength / 4));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        case TypedArrayType::FLOAT64: {
//            JS::RootedObject typeArray(__cx, JS_NewFloat64ArrayWithBuffer(__cx, jsobj, offset, byteLength / 8));
//            return Object::_createJSObject(nullptr, typeArray);
//        }
//        default:
//            assert(false); // Should never go here.
//            break;
//    }

    return nullptr;
}

Object *Object::createUint8TypedArray(uint8_t *data, size_t dataCount) {
    return createTypedArray(TypedArrayType::UINT8, data, dataCount);
}

Object *Object::createJSONObject(const std::string &jsonStr) {
    Object *obj = nullptr;
    JSValue jsval = JS_ParseJSON(__cx, jsonStr.c_str(), jsonStr.length(), "json_file");
    if (!JS_IsException(jsval)) {
        obj = Object::_createJSObject(nullptr, jsval);
    }
    return obj;
}

void Object::_setFinalizeCallback(JSClassFinalizer finalizeCb) {
    _finalizeCb = finalizeCb;
}

bool Object::getProperty(const char *name, Value *data, bool cachePropertyName) {
    assert(data != nullptr);
    data->setUndefined();

    assert(false);
    return false;
}

bool Object::setProperty(const char *name, const Value &v) {
    assert(false);
    return false;
}

bool Object::defineProperty(const char *name, JSPropGetter getter, JSPropSetter setter) {
    assert(false);
    return false;
}

bool Object::defineOwnProperty(const char *name, const se::Value &value, bool writable, bool enumerable, bool configurable) {
    assert(false);
    return false;
}

bool Object::call(const ValueArray &args, Object *thisObject, Value *rval /* = nullptr*/) {
    assert(isFunction());

    assert(false);

    return false;
}

bool Object::defineFunction(const char *funcName, JSCFunction* func) {
    assert(false);
    return false;
}

bool Object::getArrayLength(uint32_t *length) const {
    assert(length != nullptr);
    if (!isArray())
        return false;

    assert(false);
    return false;
}

bool Object::getArrayElement(uint32_t index, Value *data) const {
    assert(data != nullptr);
    if (!isArray())
        return false;

    assert(false);
    return false;
}

bool Object::setArrayElement(uint32_t index, const Value &data) {
    if (!isArray())
        return false;

    assert(false);
    return false;
}

bool Object::isFunction() const {
    return JS_IsFunction(__cx, _obj);
}

bool Object::isTypedArray() const {
    assert(false);
    return false;
}

Object::TypedArrayType Object::getTypedArrayType() const {
    TypedArrayType ret = TypedArrayType::NONE;
//    JSValue     obj = _getJSObject();
//    if (JS_IsInit(obj))
//        ret = TypedArrayType::INT8;
//    else if (JS_IsInt16Array(obj))
//        ret = TypedArrayType::INT16;
//    else if (JS_IsInt32Array(obj))
//        ret = TypedArrayType::INT32;
//    else if (JS_IsUint8Array(obj))
//        ret = TypedArrayType::UINT8;
//    else if (JS_IsUint8ClampedArray(obj))
//        ret = TypedArrayType::UINT8_CLAMPED;
//    else if (JS_IsUint16Array(obj))
//        ret = TypedArrayType::UINT16;
//    else if (JS_IsUint32Array(obj))
//        ret = TypedArrayType::UINT32;
//    else if (JS_IsFloat32Array(obj))
//        ret = TypedArrayType::FLOAT32;
//    else if (JS_IsFloat64Array(obj))
//        ret = TypedArrayType::FLOAT64;

    return ret;
}

bool Object::getTypedArrayData(uint8_t **ptr, size_t *length) const {
    assert(false);
    return false;
}

bool Object::isArray() const {
    return JS_IsArray(__cx, _obj) != 0;
}

bool Object::isArrayBuffer() const {
    assert(false);
    return false;
}

bool Object::getArrayBufferData(uint8_t **ptr, size_t *length) const {
    assert(isArrayBuffer());

    return false;
}

bool Object::getAllKeys(std::vector<std::string> *allKeys) const {
    assert(allKeys != nullptr);
    assert(false);

    return true;
}

void Object::setPrivateObject(PrivateObjectBase *data) {
    assert(_privateObject == nullptr);
    #if CC_DEBUG
    //assert(NativePtrToObjectMap::find(data->getRaw()) == NativePtrToObjectMap::end());
    auto it = NativePtrToObjectMap::find(data->getRaw());
    if (it != NativePtrToObjectMap::end()) {
        auto *pri = it->second->getPrivateObject();
        SE_LOGE("Already exists object %s/[%s], trying to add %s/[%s]\n", pri->getName(), typeid(*pri).name(), data->getName(), typeid(*data).name());
        #if JSB_TRACK_OBJECT_CREATION
        SE_LOGE(" previous object created at %s\n", it->second->_objectCreationStackFrame.c_str());
        #endif
        assert(false);
    }
    #endif
    internal::setPrivate(__cx, _obj, data, this, _finalizeCb); //TODO(cjh): how to use _internalData?
    NativePtrToObjectMap::emplace(data->getRaw(), this);
    _privateObject = data;
    defineOwnProperty("__native_ptr__", se::Value(static_cast<uint64_t>(reinterpret_cast<uintptr_t>(data->getRaw()))), false, false, false);
}

PrivateObjectBase *Object::getPrivateObject() const {
    if (_privateObject == nullptr) {
        const_cast<Object *>(this)->_privateObject = static_cast<PrivateObjectBase *>(internal::getPrivate(__cx, _obj, 0));
    }
    return _privateObject;
}

void Object::clearPrivateData(bool clearMapping) {
    if (_privateObject != nullptr) {
        if (clearMapping) {
            NativePtrToObjectMap::erase(_privateObject->getRaw());
        }

        internal::clearPrivate(__cx, _obj);
        defineOwnProperty("__native_ptr__", se::Value(static_cast<uint64_t>(reinterpret_cast<uintptr_t>(nullptr))), false, false, false);
        delete _privateObject;
        _privateObject = nullptr;
    }
}

void Object::setContext(JSContext *cx) {
    __cx = cx;
}

// static
void Object::cleanup() {
    for (const auto &e : __objectMap) {
        e.first->reset();
    }

    ScriptEngine::getInstance()->addAfterCleanupHook([]() {
        __objectMap.clear();
        const auto &instance = NativePtrToObjectMap::instance();
        for (const auto &e : instance) {
            e.second->decRef();
        }
        NativePtrToObjectMap::clear();
        __cx = nullptr;
    });
}

JSValue Object::_getJSObject() const {
    return _obj;
}

void Object::root() {
    if (_rootCount == 0) {
        protect();
    }
    ++_rootCount;
}

void Object::unroot() {
    if (_rootCount > 0) {
        --_rootCount;
        if (_rootCount == 0) {
            unprotect();
        }
    }
}

void Object::protect() {
    JS_DupValue(__cx, _obj);
}

void Object::unprotect() {
    JS_FreeValue(__cx, _obj);
}

void Object::reset() {
    _obj = JS_UNDEFINED;
}

bool Object::isRooted() const {
    return _rootCount > 0;
}

bool Object::strictEquals(Object *o) const {
    assert(false);
    return false;
}

bool Object::attachObject(Object *obj) {
    assert(obj);

    Object *global = ScriptEngine::getInstance()->getGlobalObject();
    Value   jsbVal;
    if (!global->getProperty("jsb", &jsbVal))
        return false;
    Object *jsbObj = jsbVal.toObject();

    Value func;

    if (!jsbObj->getProperty("registerNativeRef", &func))
        return false;

    ValueArray args;
    args.push_back(Value(this));
    args.push_back(Value(obj));
    func.toObject()->call(args, global);
    return true;
}

bool Object::detachObject(Object *obj) {
    assert(obj);
    Object *global = ScriptEngine::getInstance()->getGlobalObject();
    Value   jsbVal;
    if (!global->getProperty("jsb", &jsbVal))
        return false;
    Object *jsbObj = jsbVal.toObject();

    Value func;

    if (!jsbObj->getProperty("unregisterNativeRef", &func))
        return false;

    ValueArray args;
    args.push_back(Value(this));
    args.push_back(Value(obj));
    func.toObject()->call(args, global);
    return true;
}

std::string Object::toString() const {
    std::string ret;
    if (isFunction() || isArray() || isTypedArray()) {
        internal::forceConvertJsValueToStdString(__cx, _obj, &ret);
    } else if (isArrayBuffer()) {
        ret = "[object ArrayBuffer]";
    } else {
        ret = "[object Object]";
    }
    return ret;
}

} // namespace se

#endif // #if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS
