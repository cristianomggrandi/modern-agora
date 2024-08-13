import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"

export default function ProductImages({ images, name }: { images: string[] | undefined; name: string }) {
    const [imageIndex, setImageIndex] = useState(0)

    const nextImage = () => (images ? setImageIndex(prev => (prev + 1) % images!.length) : 0)
    const prevImage = () => (images ? setImageIndex(prev => (prev > 0 ? prev - 1 : images!.length - 1)) : 0)

    //  TODO: Handle product with no images
    return (
        <div className="product-images flex-1 flex flex-col-reverse md:flex-row items-center justify-center gap-4">
            <div className="flex md:flex-col gap-2 justify-center">
                {images?.length! > 1
                    ? images!.map((img, index) => (
                          <div
                              className="h-12 w-12 overflow-hidden flex items-center cursor-pointer"
                              onClick={() => setImageIndex(index)}
                              onMouseOver={() => setImageIndex(index)}
                              key={index}
                          >
                              <img src={img} alt={"Image " + index} height={48} width={48} />
                          </div>
                      ))
                    : null}
            </div>
            <div className="flex border border-nostr shadow-nostr shadow rounded w-[90%] md:h-96 items-center justify-center relative">
                {images ? (
                    <>
                        {images.map((image, index) => (
                            <div className={`bg-center ${imageIndex === index ? "block" : "hidden"}`} key={index}>
                                <img
                                    src={image}
                                    className={`absolute top-0 left-0 w-full h-full blur-sm object-center object-cover `}
                                    loading="lazy"
                                    alt=""
                                />
                                <img src={image} alt={name} className={`relative max-w-full max-h-96 z-10 p-1`} loading="lazy" />
                            </div>
                        ))}
                        {images?.length > 1 ? (
                            <>
                                <button
                                    className="absolute z-10 top-1/2 left-0 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                    onClick={prevImage}
                                >
                                    <FontAwesomeIcon icon={faAngleLeft} />
                                </button>
                                <button
                                    className="absolute z-10 top-1/2 right-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                    onClick={nextImage}
                                >
                                    <FontAwesomeIcon icon={faAngleRight} />
                                </button>
                            </>
                        ) : null}
                    </>
                ) : (
                    "No images"
                )}
            </div>
        </div>
    )
}
