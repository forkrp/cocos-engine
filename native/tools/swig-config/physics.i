%module(target_namespace="jsb.physics") physics

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "physics/PhysicsSDK.h"
#include "bindings/auto/jsb_scene_auto.h"
%}

%{
#include "bindings/auto/jsb_physics_auto.h"
%}

%import "base/Macros.h"
%import "core/scene-graph/Node.h"

%import "core/geometry/Enums.h"
%import "core/geometry/AABB.h"
// %import "core/geometry/Obb.h"
%import "core/geometry/Line.h"
%import "core/geometry/Plane.h"
%import "core/geometry/Frustum.h"
%import "core/geometry/Capsule.h"
%import "core/geometry/Sphere.h"
%import "core/geometry/Triangle.h"
%import "core/geometry/Ray.h"
%import "core/geometry/Spline.h"

%include "physics/spec/ILifecycle.h"
%include "physics/spec/IWorld.h"
%include "physics/spec/IBody.h"
%include "physics/spec/IShape.h"
%include "physics/spec/IJoint.h"

%include "physics/sdk/World.h"
%include "physics/sdk/RigidBody.h"
%include "physics/sdk/Shape.h"
%include "physics/sdk/Joint.h"
