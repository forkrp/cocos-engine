%module(target_namespace="dragonBones") dragonbones

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "editor-support/dragonbones-creator-support/CCDragonBonesHeaders.h"
%}

%{
#include "bindings/auto/jsb_dragonbones_auto.h"
%}

%ignore dragonBones::DragonBonesData::DragonBonesData;
%ignore dragonBones::Armature::Armature;
%ignore dragonBones::CCSlot::CCSlot;
%ignore dragonBones::WorldClock::WorldClock;
%ignore dragonBones::Animation::Animation;
%ignore dragonBones::Slot::Slot;
%ignore dragonBones::BaseFactory::BaseFactory;
%ignore dragonBones::BaseObject::BaseObject;
%ignore dragonBones::TextureData::TextureData;
%ignore dragonBones::CCTextureData::CCTextureData;
%ignore dragonBones::TextureAtlasData::TextureAtlasData;
%ignore dragonBones::CCTextureAtlasData::CCTextureAtlasData;
%ignore dragonBones::AnimationState::AnimationState;
%ignore dragonBones::EventObject::EventObject;
%ignore dragonBones::Bone::Bone;
%ignore dragonBones::Transform::Transform;
%ignore dragonBones::Matrix::Matrix;
%ignore dragonBones::TransformObject::TransformObject;
%ignore dragonBones::ArmatureData::ArmatureData;
%ignore dragonBones::BoneData::BoneData;
%ignore dragonBones::SlotData::SlotData;
%ignore dragonBones::SkinData::SkinData;
%ignore dragonBones::AnimationData::AnimationData;

%ignore dragonBones::CCFactory::destroyInstance;
%ignore dragonBones::CCFactory::loadDragonBonesData;
%ignore dragonBones::CCFactory::loadTextureAtlasData;
%ignore dragonBones::CCFactory::getRenderOrder;

%ignore dragonBones::BaseFactory::replaceDisplay;
%ignore dragonBones::BaseFactory::getAllTextureAtlasData;
%ignore dragonBones::BaseFactory::getAllDragonBonesData;
%ignore dragonBones::BaseFactory::getClassTypeIndex;
%ignore dragonBones::BaseFactory::replaceSlotDisplayList;
%ignore dragonBones::BaseFactory::getTextureAtlasData;
%ignore dragonBones::BaseFactory::parseTextureAtlasData;

%ignore dragonBones::Armature::intersectsSegment;
%ignore dragonBones::Armature::getAnimatable;
%ignore dragonBones::Armature::_addConstraint;
%ignore dragonBones::Armature::getReplacedTexture;
%ignore dragonBones::Armature::setReplacedTexture;
%ignore dragonBones::Armature::getBoneByDisplay;
%ignore dragonBones::Armature::getSlotByDisplay;
%ignore dragonBones::Armature::init;
%ignore dragonBones::Armature::_sortZOrder;
%ignore dragonBones::Armature::getBones;
%ignore dragonBones::Armature::getSlots;
%ignore dragonBones::Armature::getDisplay;
%ignore dragonBones::Armature::getTypeIndex;
%ignore dragonBones::Armature::getRenderOrder;
%ignore dragonBones::Armature::_dragonBones;
%ignore dragonBones::Armature::_constraints;

%ignore dragonBones::Animation::playConfig;
%ignore dragonBones::Animation::getAnimationConfig;
%ignore dragonBones::Animation::getTypeIndex;
%ignore dragonBones::Animation::getStates;
%ignore dragonBones::Animation::setAnimations;
%ignore dragonBones::Animation::getAnimations;

%ignore dragonBones::Slot::setRawDisplayDatas;
%ignore dragonBones::Slot::replaceDisplayData;
%ignore dragonBones::Slot::intersectsSegment;
%ignore dragonBones::Slot::init;
%ignore dragonBones::Slot::getDisplay;
%ignore dragonBones::Slot::getRawDisplay;
%ignore dragonBones::Slot::getMeshDisplay;
%ignore dragonBones::Slot::setDisplay;
%ignore dragonBones::Slot::setDisplayList;
%ignore dragonBones::Slot::_updateBlendMode;
%ignore dragonBones::Slot::_updateVisible;
%ignore dragonBones::Slot::_setDisplayIndex;
%ignore dragonBones::Slot::_setDisplayList;
%ignore dragonBones::Slot::getDisplayList;
%ignore dragonBones::Slot::_setColor;
%ignore dragonBones::Slot::_setDisplayList;
%ignore dragonBones::Slot::_displayData;
%ignore dragonBones::Slot::_deformVertices;
%ignore dragonBones::Slot::_cachedFrameIndices;
%ignore dragonBones::Slot::_colorDirty;
%ignore dragonBones::Slot::_blendMode;
%ignore dragonBones::Slot::_pivotX;
%ignore dragonBones::Slot::_pivotY;
%ignore dragonBones::Slot::_colorTransform;
%ignore dragonBones::Slot::_slotData;
%ignore dragonBones::Slot::_rawDisplay;
%ignore dragonBones::Slot::_meshDisplay;

%ignore dragonBones::AnimationState::init;
%ignore dragonBones::AnimationState::copyFrom;
%ignore dragonBones::AnimationState::getTypeIndex;
%ignore dragonBones::AnimationState::_actionTimeline;

%ignore dragonBones::CCSlot::getTexture;
%ignore dragonBones::CCSlot::_onClear;
%ignore dragonBones::CCSlot::getClassTypeIndex;
%ignore dragonBones::CCSlot::getTypeIndex;
%ignore dragonBones::CCSlot::worldVerts;
%ignore dragonBones::CCSlot::worldMatrix;
%ignore dragonBones::CCSlot::_worldMatDirty;
%ignore dragonBones::CCSlot::triangles;
%ignore dragonBones::CCSlot::color;
%ignore dragonBones::CCSlot::boundsRect;

%ignore dragonBones::Transform::operator=;
%ignore dragonBones::Transform::fromMatrix;
%ignore dragonBones::Transform::add;
%ignore dragonBones::Transform::identity;
%ignore dragonBones::Transform::minus;
%ignore dragonBones::Transform::toMatrix;

%ignore dragonBones::Matrix::operator=;
%ignore dragonBones::Matrix::identity;
%ignore dragonBones::Matrix::concat;
%ignore dragonBones::Matrix::invert;
%ignore dragonBones::Matrix::transformPoint;
%ignore dragonBones::Matrix::transformRectangle;

%ignore dragonBones::WorldClock::contains;
%ignore dragonBones::WorldClock::add;
%ignore dragonBones::WorldClock::remove;
%ignore dragonBones::WorldClock::clock;

%ignore dragonBones::ArmatureData::getData;
%ignore dragonBones::ArmatureData::setUserData;
%ignore dragonBones::ArmatureData::addConstraint;
%ignore dragonBones::ArmatureData::getUserData;
%ignore dragonBones::ArmatureData::getConstraint;
%ignore dragonBones::ArmatureData::addAction;
%ignore dragonBones::ArmatureData::setCacheFrame;
%ignore dragonBones::ArmatureData::getCacheFrame;
%ignore dragonBones::ArmatureData::getTypeIndex;
%ignore dragonBones::ArmatureData::getActions;
%ignore dragonBones::ArmatureData::getDefaultActions;
%ignore dragonBones::ArmatureData::cacheFrames;
%ignore dragonBones::ArmatureData::addBone;
%ignore dragonBones::ArmatureData::addSlot;
%ignore dragonBones::ArmatureData::addSkin;
%ignore dragonBones::ArmatureData::addAnimation;
%ignore dragonBones::ArmatureData::getSortedBones;
%ignore dragonBones::ArmatureData::getSortedSlots;

%ignore dragonBones::ArmatureData::canvas;
%ignore dragonBones::ArmatureData::userData;
%ignore dragonBones::ArmatureData::defaultActions;
%ignore dragonBones::ArmatureData::actions;
%ignore dragonBones::ArmatureData::type;
%ignore dragonBones::ArmatureData::cacheFrameRate;
%ignore dragonBones::ArmatureData::scale;
%ignore dragonBones::ArmatureData::aabb;
%ignore dragonBones::ArmatureData::animationNames;
%ignore dragonBones::ArmatureData::sortedBones;
%ignore dragonBones::ArmatureData::sortedSlots;
%ignore dragonBones::ArmatureData::bones;
%ignore dragonBones::ArmatureData::slots;
%ignore dragonBones::ArmatureData::constraints;
%ignore dragonBones::ArmatureData::skins;
%ignore dragonBones::ArmatureData::animations;
%ignore dragonBones::ArmatureData::defaultSkin;
%ignore dragonBones::ArmatureData::defaultAnimation;
%ignore dragonBones::ArmatureData::parent;

%ignore dragonBones::BoneData::getData;
%ignore dragonBones::BoneData::getUserData;
%ignore dragonBones::BoneData::setUserData;
%ignore dragonBones::BoneData::getTypeIndex;
%ignore dragonBones::BoneData::userData;
%ignore dragonBones::BoneData::inheritTranslation;
%ignore dragonBones::BoneData::inheritRotation;
%ignore dragonBones::BoneData::inheritScale;
%ignore dragonBones::BoneData::inheritReflection;
%ignore dragonBones::BoneData::length;
%ignore dragonBones::BoneData::transform;
%ignore dragonBones::BoneData::userData;

%ignore dragonBones::SlotData::getUserData;
%ignore dragonBones::SlotData::setUserData;
%ignore dragonBones::SlotData::getDefaultColor;
%ignore dragonBones::SlotData::createColor;
%ignore dragonBones::SlotData::setColor;
%ignore dragonBones::SlotData::getColor;
%ignore dragonBones::SlotData::getDefaultColor;
%ignore dragonBones::SlotData::getTypeIndex;
%ignore dragonBones::SlotData::color;
%ignore dragonBones::SlotData::userData;
%ignore dragonBones::SlotData::DEFAULT_COLOR;

%ignore dragonBones::AnimationData::getActionTimeline;
%ignore dragonBones::AnimationData::setActionTimeline;
%ignore dragonBones::AnimationData::addConstraintTimeline;
%ignore dragonBones::AnimationData::setZOrderTimeline;
%ignore dragonBones::AnimationData::cacheFrames;
%ignore dragonBones::AnimationData::addBoneTimeline;
%ignore dragonBones::AnimationData::addSlotTimeline;
%ignore dragonBones::AnimationData::getSlotTimelines;
%ignore dragonBones::AnimationData::getBoneTimelines;
%ignore dragonBones::AnimationData::getConstraintTimelines;
%ignore dragonBones::AnimationData::getClassTypeIndex;
%ignore dragonBones::AnimationData::getTypeIndex;
%ignore dragonBones::AnimationData::frameIntOffset;
%ignore dragonBones::AnimationData::frameFloatOffset;
%ignore dragonBones::AnimationData::frameOffset;
%ignore dragonBones::AnimationData::scale;
%ignore dragonBones::AnimationData::cacheFrameRate;
%ignore dragonBones::AnimationData::cachedFrames;
%ignore dragonBones::AnimationData::boneTimelines;
%ignore dragonBones::AnimationData::slotTimelines;
%ignore dragonBones::AnimationData::constraintTimelines;
%ignore dragonBones::AnimationData::boneCachedFrameIndices;
%ignore dragonBones::AnimationData::slotCachedFrameIndices;
%ignore dragonBones::AnimationData::actionTimeline;
%ignore dragonBones::AnimationData::zOrderTimeline;
%ignore dragonBones::AnimationData::parent;

%ignore dragonBones::BaseObject::getClassTypeIndex;
%ignore dragonBones::BaseObject::setObjectRecycleOrDestroyCallback;
%ignore dragonBones::BaseObject::isInPool;
%ignore dragonBones::BaseObject::getAllObjects;

%ignore dragonBones::TextureAtlasData::getTextures;
%ignore dragonBones::TextureAtlasData::copyFrom;
%ignore dragonBones::TextureAtlasData::autoSearch;
%ignore dragonBones::TextureAtlasData::format;
%ignore dragonBones::TextureAtlasData::width;
%ignore dragonBones::TextureAtlasData::height;
%ignore dragonBones::TextureAtlasData::scale;
%ignore dragonBones::TextureAtlasData::imagePath;
%ignore dragonBones::TextureAtlasData::textures;

%ignore dragonBones::DragonBonesData::autoSearch;
%ignore dragonBones::DragonBonesData::frameRate;
%ignore dragonBones::DragonBonesData::version;
%ignore dragonBones::DragonBonesData::frameIndices;
%ignore dragonBones::DragonBonesData::cachedFrames;
%ignore dragonBones::DragonBonesData::armatureNames;
%ignore dragonBones::DragonBonesData::armatures;
%ignore dragonBones::DragonBonesData::binary;
%ignore dragonBones::DragonBonesData::intArray;
%ignore dragonBones::DragonBonesData::floatArray;
%ignore dragonBones::DragonBonesData::frameIntArray;
%ignore dragonBones::DragonBonesData::frameFloatArray;
%ignore dragonBones::DragonBonesData::frameArray;
%ignore dragonBones::DragonBonesData::timelineArray;
%ignore dragonBones::DragonBonesData::userData;
%ignore dragonBones::DragonBonesData::getUserData;
%ignore dragonBones::DragonBonesData::setUserData;
%ignore dragonBones::DragonBonesData::getTypeIndex;

%ignore dragonBones::SkinData::replaceDisplay;
%ignore dragonBones::SkinData::setRawDisplayDatas;
%ignore dragonBones::SkinData::replaceDisplayData;
%ignore dragonBones::SkinData::addDisplay;
%ignore dragonBones::SkinData::getDisplay;
%ignore dragonBones::SkinData::getDisplays;
%ignore dragonBones::SkinData::getSlotDisplays;
%ignore dragonBones::SkinData::getTypeIndex;
%ignore dragonBones::SkinData::displays;
%ignore dragonBones::SkinData::parent;

%ignore dragonBones::Bone::getTypeIndex;
%ignore dragonBones::Bone::_cachedFrameIndices;

%ignore dragonBones::EventObject::getData;
%ignore dragonBones::EventObject::actionData;
%ignore dragonBones::EventObject::data;
%ignore dragonBones::EventObject::getTypeIndex;
%ignore dragonBones::EventObject::actionDataToInstance;

%ignore dragonBones::TextureData::copyFrom;
%ignore dragonBones::TextureData::rotated;
%ignore dragonBones::TextureData::name;
%ignore dragonBones::TextureData::region;
%ignore dragonBones::TextureData::frame;
%ignore dragonBones::TextureData::parent;

%ignore dragonBones::CCTextureAtlasData::setRenderTexture;
%ignore dragonBones::CCTextureAtlasData::getRenderTexture;
%ignore dragonBones::CCTextureAtlasData::getTypeIndex;

%ignore dragonBones::CCTextureData::getTypeIndex;

%ignore dragonBones::CCArmatureDisplay::render;
%ignore dragonBones::CCArmatureDisplay::update;
%ignore dragonBones::CCArmatureDisplay::getRenderOrder;

%ignore dragonBones::RealTimeAttachUtil::syncAttachedNode;

%ignore dragonBones::CacheModeAttachUtil::syncAttachedNode;

%ignore dragonBones::AttachUtilBase::releaseAttachedNode;

%ignore dragonBones::CCArmatureCacheDisplay::getRenderOrder;

%ignore dragonBones::ArmatureCache::SegmentData;
%ignore dragonBones::ArmatureCache::BoneData;
%ignore dragonBones::ArmatureCache::ColorData;
%ignore dragonBones::ArmatureCache::FrameData;
%ignore dragonBones::ArmatureCache::AnimationData;

%rename (armature) dragonBones::CCArmatureCacheDisplay::getArmature;
%rename (armature) dragonBones::CCArmatureDisplay::getArmature;

%import "editor-support/dragonbones/core/DragonBones.h"

%include "editor-support/dragonbones/geom/Rectangle.h"
%include "editor-support/dragonbones/geom/Transform.h"
%include "editor-support/dragonbones/geom/Matrix.h"

%include "editor-support/dragonbones/core/BaseObject.h"
%include "editor-support/dragonbones/event/EventObject.h"
%include "editor-support/dragonbones/factory/BaseFactory.h"

%include "editor-support/dragonbones/model/DragonBonesData.h"
%include "editor-support/dragonbones/model/TextureAtlasData.h"
%include "editor-support/dragonbones/model/ArmatureData.h"
%include "editor-support/dragonbones/model/SkinData.h"
%include "editor-support/dragonbones/model/AnimationData.h"

%include "editor-support/dragonbones/animation/WorldClock.h"
%include "editor-support/dragonbones/animation/Animation.h"
%include "editor-support/dragonbones/animation/AnimationState.h"

%include "editor-support/dragonbones/armature/TransformObject.h"
%include "editor-support/dragonbones/armature/Slot.h"
%include "editor-support/dragonbones/armature/Bone.h"
%include "editor-support/dragonbones/armature/Armature.h"

%include "editor-support/dragonbones-creator-support/CCArmatureDisplay.h"
%include "editor-support/dragonbones-creator-support/CCFactory.h"
%include "editor-support/dragonbones-creator-support/CCSlot.h"
%include "editor-support/dragonbones-creator-support/CCArmatureCacheDisplay.h"
%include "editor-support/dragonbones-creator-support/ArmatureCache.h"
%include "editor-support/dragonbones-creator-support/ArmatureCacheMgr.h"
