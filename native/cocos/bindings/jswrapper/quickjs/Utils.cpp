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

#include "Utils.h"

#if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS

    #include "Class.h"
    #include "Object.h"
    #include "ScriptEngine.h"

namespace se {

namespace internal {

void* SE_JS_GetPrivate(JSValue obj, uint32_t slot) {
    assert(slot >= 0 && slot < 2);
    return nullptr;
}

void SE_JS_SetPrivate(JSValue obj, uint32_t slot, void* data) {
    assert(slot >= 0 && slot < 2);
}

bool isJSBClass(JSValue obj) {
    return false;
}

void forceConvertJsValueToStdString(JSContext *cx, JSValue jsval, std::string *ret) {
    assert(ret != nullptr);

}

std::string jsToStdString(JSContext *cx, JSValue jsStr) {
    std::string ret;
    return ret;
}

void jsToSeArgs(JSContext *cx, int argc, JSValueConst *argv, ValueArray &outArr) {
    for (int i = 0; i < argc; ++i) {
        jsToSeValue(cx, argv[i], &outArr[i]);
    }
}

void seToJsArgs(JSContext *cx, const ValueArray &args, JSValue *outArr) {
    for (const auto &arg : args) {
//        JS::RootedValue v(cx);
//        seToJsValue(cx, arg, &v);
//        outArr->append(v);
    }
}

void seToJsValue(JSContext *cx, const Value &arg, JSValue *outVal) {
    switch (arg.getType()) {
        case Value::Type::Number: {
            *outVal = JS_NewFloat64(cx, arg.toDouble());
        } break;

        case Value::Type::String: {
            *outVal = JS_NewStringLen(cx, arg.toString().c_str(), arg.toString().length());
        } break;

        case Value::Type::Boolean: {
            *outVal = JS_NewBool(cx, arg.toBoolean());
        } break;

        case Value::Type::Object: {
            *outVal = arg.toObject()->_getJSObject();
        } break;

        case Value::Type::Null: {

        } break;

        case Value::Type::Undefined: {

        } break;
        case Value::Type::BigInt: {

        }
            break;
        default:
            assert(false);
            break;
    }
}

void jsToSeValue(JSContext *cx, JSValue jsval, Value *v) {
    if (JS_IsNumber(jsval)) {
        double val{0.0};
        JS_ToFloat64(cx, &val, jsval);
        v->setDouble(val);
    } else if (JS_IsString(jsval)) {
        const char* cStr = JS_ToCString(cx, jsval);
        if (cStr != nullptr) {
            v->setString(cStr);
            JS_FreeCString(cx, cStr);
        }
    } else if (JS_IsBool(jsval)) {
        v->setBoolean(JS_ToBool(cx, jsval));
    } else if (JS_IsObject(jsval)) {
        Object *object = nullptr;
        PrivateObjectBase *privateObject = static_cast<PrivateObjectBase *>(getPrivate(cx, jsval, 0));
        void *nativeObj = privateObject ? privateObject->getRaw() : nullptr;
        bool needRoot = false;
        if (nativeObj != nullptr) {
            object = Object::getObjectWithPtr(nativeObj);
        }

        if (object == nullptr) {
            object = Object::_createJSObject(nullptr, jsval);
            needRoot = true;
        }
        v->setObject(object, needRoot);
        object->decRef();
    } else if (JS_IsNull(jsval)) {
        v->setNull();
    } else if (JS_IsUndefined(jsval)) {
        v->setUndefined();
    } else if (JS_IsBigInt(cx, jsval)) {
        int64_t val{0};
        JS_ToBigInt64(cx, &val, jsval);
        v->setInt64(val);
    } else {
        assert(false);
    }
}

void setReturnValue(JSContext *cx, const Value &data, JSValueConst *argv) {

}

bool hasPrivate(JSContext *cx, JSValue obj) {
    return isJSBClass(obj);
}

void *getPrivate(JSContext *cx, JSValue obj, uint32_t slot) {
    bool found = isJSBClass(obj);
    if (found) {
        return SE_JS_GetPrivate(obj, slot);
    }

    return nullptr;
}

void setPrivate(JSContext *cx, JSValue obj, PrivateObjectBase *data, Object *seObj, JSClassFinalizer finalizeCb) {
    bool found = isJSBClass(obj);
    assert(found);
    if (found) {
        SE_JS_SetPrivate(obj, 0, data);
        SE_JS_SetPrivate(obj, 1, seObj);
    }
}

void clearPrivate(JSContext *cx, JSValue obj) {
    bool found = isJSBClass(obj);
    if (found) {
        SE_JS_SetPrivate(obj, 0, nullptr);
        SE_JS_SetPrivate(obj, 1, nullptr);
    }
}

} // namespace internal
} // namespace se

#endif // #if SCRIPT_ENGINE_TYPE == SCRIPT_ENGINE_QUICKJS
