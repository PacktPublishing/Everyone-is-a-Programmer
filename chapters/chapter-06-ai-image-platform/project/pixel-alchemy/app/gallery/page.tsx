"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, Trash2 } from "lucide-react"

// Mock data for demonstration
const mockImages = [
  { id: 1, url: "/cyberpunk-cityscape-neon.png", title: "Cyberpunk Cityscape", createdAt: "2024-01-15" },
  {
    id: 2,
    url: "/ethereal-fantasy-forest-with-magical-creatures.png",
    title: "Fantasy Forest",
    createdAt: "2024-01-14",
  },
  { id: 3, url: "/vibrant-abstract-digital-art.png", title: "Abstract Digital Art", createdAt: "2024-01-13" },
  { id: 4, url: "/portrait-of-a-character-in-anime-style.png", title: "Anime Character", createdAt: "2024-01-12" },
  { id: 5, url: "/steampunk-mechanical-dragon.png", title: "Steampunk Dragon", createdAt: "2024-01-11" },
  { id: 6, url: "/minimalist-geometric-composition.png", title: "Geometric Art", createdAt: "2024-01-10" },
  { id: 7, url: "/floating-islands-dreamscape.png", title: "Floating Islands", createdAt: "2024-01-09" },
  { id: 8, url: "/ai-artwork.png", title: "AI Artwork", createdAt: "2024-01-08" },
]

export default function GalleryPage() {
  const [images, setImages] = useState(mockImages)

  const handleDownload = (imageUrl: string, title: string) => {
    // Create a temporary link element to trigger download
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = (imageId: number) => {
    setImages(images.filter((img) => img.id !== imageId))
  }

  const handleUpload = () => {
    // Navigate to workspace or open upload dialog
    window.location.href = "/workspace"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">my creation</h1>
            <Button
              onClick={handleUpload}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload new work
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No works created yet</h3>
            <p className="text-muted-foreground mb-6">Start creating your firstAIWorks of art!</p>
            <Button
              onClick={handleUpload}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Start creating
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group relative overflow-hidden border border-border/40 hover:border-border/60 transition-all duration-300 p-0"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="text-white">
                        <h3 className="font-semibold text-sm truncate">{image.title}</h3>
                        <p className="text-xs text-white/70">{image.createdAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                          onClick={() => handleDownload(image.url, image.title)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
