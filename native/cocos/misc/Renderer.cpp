#include "Renderer.h"
#include "serialization/BinaryInputArchive.h"
#include "serialization/JsonInputArchive.h"


namespace cc {

CC_IMPL_SERIALIZE(Renderer)

template <class Archive>
void Renderer::serialize(Archive &ar) {
    Super::serialize(ar);
    CC_SERIALIZE(_materials);
}

}
