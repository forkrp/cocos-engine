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

%ignore cc::network::Downloader::createDataTask;
%ignore cc::network::Downloader::createDownloadTask;
%ignore cc::network::Downloader::abort;
%ignore cc::network::Downloader::setOnError;
%ignore cc::network::Downloader::setOnSuccess;

%attribute_writeonly(cc::network::Downloader, std::function<void(const DownloadTask &, uint32_t, uint32_t, uint32_t)>&, onProgress, setOnProgress);

%import "base/Macros.h"

%include "network/Downloader.h"
