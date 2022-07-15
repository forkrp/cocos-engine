%module(target_namespace="ns") geometry

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "core/geometry/Geometry.h"
%}

%{
#include "bindings/auto/jsb_geometry_auto.h"
%}

%ignore cc::geometry::AABB::getBoundary;
%ignore cc::geometry::AABB::aabbAabb;
%ignore cc::geometry::AABB::aabbFrustum;
%ignore cc::geometry::AABB::aabbPlan;
%ignore cc::geometry::AABB::merge;
%ignore cc::geometry::AABB::transform;
%ignore cc::geometry::AABB::transformExtentM4;
%ignore cc::geometry::AABB::isValid;
%ignore cc::geometry::AABB::setValid;
%ignore cc::geometry::AABB::set;
%ignore cc::geometry::AABB::fromPoints;
%ignore cc::geometry::AABB::getCenter;
%ignore cc::geometry::AABB::setCenter;
%ignore cc::geometry::AABB::getHalfExtents;
%ignore cc::geometry::AABB::setHalfExtents;

%ignore cc::geometry::Frustum::update;
%ignore cc::geometry::Frustum::type;
%ignore cc::geometry::Frustum::split;

%ignore cc::geometry::Plane::clone;
%ignore cc::geometry::Plane::copy;
%ignore cc::geometry::Plane::normalize;
%ignore cc::geometry::Plane::getSpotAngle;
%ignore cc::geometry::Plane::fromNormalAndPoint;
%ignore cc::geometry::Plane::fromPoints;
%ignore cc::geometry::Plane::set;

%ignore cc::geometry::Ray::computeHit;

%ignore cc::geometry::Sphere::getBoundary;

%import "base/Macros.h"

%import "math/MathBase.h"
%import "math/Vec2.h"
%import "math/Vec3.h"
%import "math/Vec4.h"
%import "math/Color.h"
%import "math/Mat3.h"
%import "math/Mat4.h"
%import "math/Quaternion.h"

%include "core/geometry/Enums.h"
%include "core/geometry/AABB.h"
// %include "core/geometry/Obb.h"
%include "core/geometry/Line.h"
%include "core/geometry/Plane.h"
%include "core/geometry/Frustum.h"
%include "core/geometry/Capsule.h"
%include "core/geometry/Sphere.h"
%include "core/geometry/Triangle.h"
%include "core/geometry/Ray.h"
%include "core/geometry/Spline.h"
