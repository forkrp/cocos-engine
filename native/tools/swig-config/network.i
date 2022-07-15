%module(target_namespace="jsb") network

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "network/Downloader.h"

%}

%{
#include "bindings/auto/jsb_network_auto.h"
%}

%ignore cc::network::Downloader::createDownloadDataTask;
%ignore cc::network::Downloader::createDownloadFileTask;
%ignore cc::network::Downloader::abort;
%ignore cc::network::Downloader::setOnTaskError;
%ignore cc::network::Downloader::setOnFileTaskSuccess;
%ignore cc::network::Downloader::onDataTaskSuccess;
%ignore cc::network::Downloader::onFileTaskSuccess;
%ignore cc::network::Downloader::onTaskProgress;
%ignore cc::network::Downloader::onTaskError;

%import "base/Macros.h"

%include "network/Downloader.h"
