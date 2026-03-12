"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, Heart, Wand2, X, ImageIcon } from "lucide-react"
import Image from "next/image"

type GenerationState = "idle" | "generating" | "success"

interface UploadedImage {
  id: string
  file: File
  preview: string
}

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("")
  const [generationState, setGenerationState] = useState<GenerationState>("idle")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [remainingTime, setRemainingTime] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleImageUpload = useCallback((files: FileList) => {
    const newImages: UploadedImage[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substr(2, 9)
        const preview = URL.createObjectURL(file)
        newImages.push({ id, file, preview })
      }
    })

    setUploadedImages((prev) => [...prev, ...newImages])
  }, [])

  const removeImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleImageUpload(files)
      }
    },
    [handleImageUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setGenerationState("generating")
    setRemainingTime(30)

    // Simulation generation process
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setGenerationState("success")
          setGeneratedImage("/ai-artwork.png")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a")
      link.href = generatedImage
      link.download = "generated-image.png"
      link.click()
    }
  }

  const handleSaveToGallery = () => {
    // Save simulation to gallery
    console.log("Save to gallery")
  }

  const resetGeneration = () => {
    setGenerationState("idle")
    setGeneratedImage(null)
    setRemainingTime(0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Wand2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Pixel Alchemy workbench</h1>
          </div>
          <Button variant="outline" onClick={resetGeneration}>
            New project
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Control Panel */}
        <div className="w-80 border-r border-border/40 bg-muted/30 p-6 flex flex-col gap-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Creation Description (Prompt)</label>
            <Textarea
              placeholder="Describe the image you want to generate, for example: a cyberpunk cat under the stars, neon lights, high detail, 8KResolution..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reference pictures (optional)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Drag the image here or click to upload</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("image-upload")?.click()}>
                  Select file
                </Button>
              </div>
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <Image
                      src={image.preview || "/placeholder.svg"}
                      alt="Uploaded pictures"
                      width={120}
                      height={120}
                      className="w-full h-20 object-cover rounded-lg border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Generate style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a generation style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic style</SelectItem>
                <SelectItem value="anime">anime style</SelectItem>
                <SelectItem value="cyberpunk">cyberpunk</SelectItem>
                <SelectItem value="fantasy">fantasy style</SelectItem>
                <SelectItem value="minimalist">minimalism</SelectItem>
                <SelectItem value="abstract">abstract art</SelectItem>
                <SelectItem value="vintage">retro style</SelectItem>
                <SelectItem value="watercolor">watercolor style</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generationState === "generating"}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            {generationState === "generating" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                generate image
              </>
            )}
          </Button>
        </div>

        {/* Right Display Area */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="h-full p-6 flex items-center justify-center">
              {generationState === "idle" && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Start your creative journey</h3>
                    <p className="text-muted-foreground max-w-md">
                      Enter your creative description on the left, select your favorite style, and click the Generate button to start creating.
                      You can also upload reference images for more accurate generation results.
                    </p>
                  </div>
                </div>
              )}

              {generationState === "generating" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Generating image...</h3>
                    <p className="text-muted-foreground">Estimated time remaining: {remainingTime} Second</p>
                    <div className="w-64 mx-auto bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((30 - remainingTime) / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {generationState === "success" && generatedImage && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="relative">
                    <Image
                      src={generatedImage || "/placeholder.svg"}
                      alt="generated image"
                      width={512}
                      height={512}
                      className="w-full h-auto rounded-lg border border-border shadow-lg"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleDownload} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveToGallery}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Heart className="h-4 w-4" />
                      Save to gallery
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
