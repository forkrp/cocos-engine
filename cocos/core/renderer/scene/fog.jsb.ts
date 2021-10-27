import { Enum } from '../../value-types';
import { legacyCC } from '../../global-exports';

export type Fog = jsb.Fog;
export const Fog = jsb.Fog;

/**
 * @zh
 * 全局雾类型。
 * @en
 * The global fog type
 * @static
 * @enum FogInfo.FogType
 */
export const FogType = Enum({
    /**
     * @zh
     * 线性雾。
     * @en
     * Linear fog
     * @readonly
     */
    LINEAR: 0,
    /**
     * @zh
     * 指数雾。
     * @en
     * Exponential fog
     * @readonly
     */
    EXP: 1,
    /**
     * @zh
     * 指数平方雾。
     * @en
     * Exponential square fog
     * @readonly
     */
    EXP_SQUARED: 2,
    /**
     * @zh
     * 层叠雾。
     * @en
     * Layered fog
     * @readonly
     */
    LAYERED: 3,
});

const FOG_TYPE_NONE = FogType.LAYERED + 1;

legacyCC.Fog = Fog;
