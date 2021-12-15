export function syncNodeValues (node: any) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jsb.Node.flushCommandsToNative();
    const lpos = node._lpos;
    let x = lpos.x;
    let y = lpos.y;
    let z = lpos.z;
    if (x !== null || y !== null || z !== null) {
        lpos.x = x = x || 0;
        lpos.y = y = y || 0;
        lpos.z = z = z || 0;
        node.setPositionForJS(x, y, z);
    } else {
        lpos.x = lpos.y = lpos.z = 0;
    }

    const lscale = node._lscale;
    x = lscale.x;
    y = lscale.y;
    z = lscale.z;
    if (x !== null || y !== null || z !== null) {
        lscale.x = x = x || 1;
        lscale.y = y = y || 1;
        lscale.z = z = z || 1;
        node.setScaleForJS(x, y, z);
    } else {
        lscale.x = lscale.y = lscale.z = 1;
    }

    const lrot = node._lrot;
    x = lrot.x;
    y = lrot.y;
    z = lrot.z;
    let w = lrot.w;
    if (x !== null || y !== null || z !== null || w != null) {
        lrot.x = x = x || 0;
        lrot.y = y = y || 0;
        lrot.z = z = z || 0;
        lrot.w = w = w || 1;
        node.setRotationForJS(x, y, z, w);
    } else {
        lrot.x = lrot.y = lrot.z = 0;
        lrot.w = 1;
    }

    const euler = node._euler;
    x = euler.x;
    y = euler.y;
    z = euler.z;
    if (x !== null || y !== null || z !== null) {
        euler.x = x = x || 0;
        euler.y = y = y || 0;
        euler.z = z = z || 0;
        node.setRotationFromEulerForJS(x, y, z);
    } else {
        euler.x = euler.y = euler.z = 0;
    }
}

export function updateChildrenForDeserialize (node: any) {
    if (!node) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jsb.Node.flushCommandsToNative();
    node._setChildren(node._children);
    for (let i = 0, len = node._children.length; i < len; ++i) {
        const child = node._children[i];
        updateChildrenForDeserialize(child);
    }
}
