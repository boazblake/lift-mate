import Foundation
import Capacitor
import MediaPipe
import UIKit
import CoreVideo

@objc public class CapacitorMediaPipe: NSObject, HolisticSolutionDelegate {
    private var holistic: Holistic?
    public var resultsHandler: (([String: Any]) -> Void)?

    @objc public func initialize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                self.holistic = Holistic()
                self.holistic?.solutionDelegate = self

                self.holistic?.setOptions(
                    modelComplexity: .full,
                    smoothLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    selfieMode: false
                )

                call.resolve()
            } catch {
                call.reject("Failed to initialize MediaPipe Holistic: \(error.localizedDescription)")
            }
        }
    }

    @objc public func send(_ call: CAPPluginCall) {
        guard let imageData = call.getString("image"),
              let data = Data(base64Encoded: imageData) else {
            call.reject("Image data not provided or invalid.")
            return
        }

        guard let uiImage = UIImage(data: data) else {
            call.reject("Failed to create UIImage from data.")
            return
        }

        guard let pixelBuffer = uiImage.toCVPixelBuffer() else {
            call.reject("Failed to convert UIImage to CVPixelBuffer.")
            return
        }

        DispatchQueue.main.async {
            do {
                try self.holistic?.process(pixelBuffer: pixelBuffer)
                call.resolve()
            } catch {
                call.reject("Failed to process image with MediaPipe: \(error.localizedDescription)")
            }
        }
    }

    @objc public func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.holistic?.close()
            self.holistic = nil
            call.resolve()
        }
    }

    
}

extension UIImage {
    func toCVPixelBuffer() -> CVPixelBuffer? {
        let attrs = [
            kCVPixelBufferCGImageCompatibilityKey: kCFBooleanTrue,
            kCVPixelBufferCGBitmapContextCompatibilityKey: kCFBooleanTrue
        ] as CFDictionary
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(kCFAllocatorDefault,
                                         Int(self.size.width),
                                         Int(self.size.height),
                                         kCVPixelFormatType_32BGRA,
                                         attrs,
                                         &pixelBuffer)
        guard status == kCVReturnSuccess else {
            return nil
        }

        CVPixelBufferLockBaseAddress(pixelBuffer!, CVPixelBufferLockFlags(rawValue: 0))
        let pixelData = CVPixelBufferGetBaseAddress(pixelBuffer!)

        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        let context = CGContext(data: pixelData,
                                width: Int(self.size.width),
                                height: Int(self.size.height),
                                bitsPerComponent: 8,
                                bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer!),
                                space: rgbColorSpace,
                                bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)

        guard let cgImage = self.cgImage else { return nil }
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: self.size.width, height: self.size.height))

        CVPixelBufferUnlockBaseAddress(pixelBuffer!, CVPixelBufferLockFlags(rawValue: 0))

        return pixelBuffer
    }
}

// MARK: - HolisticSolutionDelegate
extension CapacitorMediaPipe: HolisticSolutionDelegate {
    public func holisticSolution(_ solution: Holistic, didOutput results: HolisticResult) {
        var holisticData: [String: Any] = [:]

        if let poseLandmarks = results.poseLandmarks {
            holisticData["poseLandmarks"] = poseLandmarks.landmarkList.map {
                ["x": $0.x, "y": $0.y, "z": $0.z, "visibility": $0.visibility]
            }
        }
        if let faceLandmarks = results.faceLandmarks {
            holisticData["faceLandmarks"] = faceLandmarks.landmarkList.map {
                ["x": $0.x, "y": $0.y, "z": $0.z]
            }
        }
        if let leftHandLandmarks = results.leftHandLandmarks {
            holisticData["leftHandLandmarks"] = leftHandLandmarks.landmarkList.map {
                ["x": $0.x, "y": $0.y, "z": $0.z]
            }
        }
        if let rightHandLandmarks = results.rightHandLandmarks {
            holisticData["rightHandLandmarks"] = rightHandLandmarks.landmarkList.map {
                ["x": $0.x, "y": $0.y, "z": $0.z]
            }
        }

        self.resultsHandler?(holisticData)
    }
}