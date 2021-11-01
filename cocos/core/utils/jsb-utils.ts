export interface IArrayProxy {
    owner: any,
    arrPropertyName: string,
    arrElementType: string,
    setArrayElementCB: (index: number, val: any) => void,
    getArrayElementCB: (index: number) => any,
    setArraySizeCB: (size: number) => void,
    getArraySizeCB: () => number,
}

class ProxyHandler {
    private _options: IArrayProxy;
    constructor(options: IArrayProxy) {
        this._options = options;
    }

    get(target: any, property: string) {
        console.log('getting ' + property + ' for :' + target);
        const i = parseInt(property);
        let result;
        if (!isNaN(i)) {
            result = target[property] = this._options.getArrayElementCB.call(this._options.owner, i);
        } else if (property === 'length') {
            result = target[property] = this._options.getArraySizeCB.call(this._options.owner);
        }

        // property is index in this case
        return result;
    }

    set(target: any, property: string, value: any, receiver: any) {
        console.log('setting ' + property + ' for ' + target + ' with value ' + value);
        const i = parseInt(property);
        if (!isNaN(i)) {
            if (typeof value === this._options.arrElementType) {
                this._options.setArrayElementCB.call(this._options.owner, i, value);
            }
        } else if (property === 'length') {
            this._options.setArraySizeCB.call(this._options.owner, value);
        }

        target[property] = value;
        // you have to return true to accept the changes
        return true;
    }
}

export function defineArrayProxy(options: IArrayProxy) {
    let arrProxy = new Proxy([], new ProxyHandler(options));
    Object.defineProperty(options.owner, options.arrPropertyName, {
        enumerable: true,
        configurable: true,
        get() {
            //TODO: get children from native and sync to arrProxy
            return arrProxy;
        },
        set(v) {
            arrProxy = new Proxy(v, new ProxyHandler(options));
            //TODO: resize native array
            options.setArraySizeCB.call(options.owner, v.length);
            for (let i = 0, len = v.length; i < len; ++i) {
                const e = v[i];
                if (typeof e === options.arrElementType) {
                    options.setArrayElementCB(i, e);
                }
            }
        }
    });
}
