import Foundation
import Capacitor
import MediaPipeTasksVision
import UIKit
import CoreVideo

@objc(CapacitorMediaPipe)
public class CapacitorMediaPipe: NSObject, PoseLandmarkerLiveStreamDelegate {
    private var poseLandmarker: PoseLandmarker?
    @objc public var resultsHandler: (([String: Any]) -> Void)?

    @objc public func initialize(_ call: CAPPluginCall) {
        let modelName = call.getString("model", "pose_landmarker_full.task")
        let minDetectionConfidence = call.getFloat("minPoseDetectionConfidence", 0.5)

        do {
            let baseOptions = BaseOptions()
            baseOptions.modelAssetPath = modelName

            let options = PoseLandmarkerOptions()
            options.baseOptions = baseOptions
            options.runningMode = .liveStream
            options.minPoseDetectionConfidence = minDetectionConfidence
            options.minPosePresenceConfidence = 0.5
            options.numPoses = 1

            poseLandmarker = try PoseLandmarker(options: options)
            call.resolve()
        } catch {
            call.reject("Failed to initialize MediaPipe PoseLandmarker: \(error.localizedDescription)")
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

        guard let mpImage = try? MPImage(uiImage: uiImage) else {
            call.reject("Failed to create MPImage from UIImage.")
            return
        }

        do {
            let timestamp = Int(Date().timeIntervalSince1970 * 1000)
            try poseLandmarker?.detectAsync(image: mpImage, timestampInMilliseconds: timestamp)
            call.resolve()
        } catch {
            call.reject("Failed to process image with MediaPipe: \(error.localizedDescription)")
        }
    }

    @objc public func close(_ call: CAPPluginCall) {
        poseLandmarker = nil
        call.resolve()
    }

    // MARK: - PoseLandmarkerLiveStreamDelegate
    public func poseLandmarker(
        _ poseLandmarker: PoseLandmarker,
        didFinishDetection result: PoseLandmarkerResult?,
        timestampInMilliseconds: Int,
        error: Error?
    ) {
        guard let result = result else {
            if let error = error {
                resultsHandler?(["error": error.localizedDescription])
            }
            return
        }

        var poseData: [String: Any] = [:]
        var landmarksArray: [[String: Any]] = []

        // landmarks is non-optional in 0.10.21
        for landmark in result.landmarks {
            let landmarkDicts = landmark.map { [
                "x": $0.x,
                "y": $0.y,
                "z": $0.z,
                "visibility": $0.visibility ?? 0.0
            ] }
            landmarksArray.append(contentsOf: landmarkDicts)
        }
        poseData["poseLandmarks"] = landmarksArray

        // worldLandmarks is non-optional in 0.10.21
        let worldLandmarksArray = result.worldLandmarks.map { landmark in
            landmark.map { ["x": $0.x, "y": $0.y, "z": $0.z] }
        }
        poseData["worldLandmarks"] = worldLandmarksArray

        resultsHandler?(poseData)
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
        guard status == kCVReturnSuccess else { return nil }

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
