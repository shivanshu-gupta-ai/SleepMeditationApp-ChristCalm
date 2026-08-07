import Foundation
import UIKit
import ImageIO
import SwiftUI

enum CharacterState: String, CaseIterable {
    case helloAnimation = "helloanimation1"
    case fact = "bunnyfact"
    case didYouKnow = "didyouknow"
    case anxiety = "anxiety"
    case notification = "notification1"
    case smile = "smile"
    case thinking = "bunnythinking"
    case sad = "sadbunny"
    case screen = "helloscreen"
    case scripture = "scripture"
    case thinkname = "thinkname"
    case preparing = "preparing"
    case seeker = "seeker"
    case tracktospend = "tracktospend"
    case happy1 = "happy1"
    case review = "review"
    case committed = "commited"

    /// Returns the asset file name for the corresponding character GIF.
    var gifName: String {
        return self.rawValue
    }

    /// Custom initializer handling raw value matching as well as legacy aliases.
    init?(rawValue: String) {
        let cleaned = rawValue.replacingOccurrences(of: ".gif", with: "").lowercased()
        if cleaned == "helloanimation1" || cleaned == "helloanimation" || cleaned == "bunnyhelloanimation" {
            self = .helloAnimation
            return
        }
        if cleaned == "notification1" || cleaned == "notification" || cleaned == "bunnynotification" {
            self = .notification
            return
        }
        if cleaned == "smile" || cleaned == "bunnysmile" {
            self = .smile
            return
        }
        if cleaned == "anxiety" || cleaned == "bunnyanxietyscreen" || cleaned == "bunnyanxiety" {
            self = .anxiety
            return
        }
        if cleaned == "scripture" || cleaned == "bunnyscripture" {
            self = .scripture
            return
        }
        if cleaned == "didyouknow" || cleaned == "bunnydidyouknowscreen" || cleaned == "bunnydidyouknow" {
            self = .didYouKnow
            return
        }
        if cleaned == "thinkname" || cleaned == "bunnythinkname" {
            self = .thinkname
            return
        }
        if cleaned == "preparing" || cleaned == "bunnypreparing" {
            self = .preparing
            return
        }
        if cleaned == "seeker" || cleaned == "bunnyseeker" {
            self = .seeker
            return
        }
        if cleaned == "tracktospend" || cleaned == "bunnytracktospend" {
            self = .tracktospend
            return
        }
        if cleaned == "happy1" || cleaned == "bunnyhappy1" || cleaned == "happy" {
            self = .happy1
            return
        }
        if cleaned == "review" || cleaned == "bunnyreview" {
            self = .review
            return
        }
        if cleaned == "commited" || cleaned == "committed" || cleaned == "bunnycommitted" {
            self = .committed
            return
        }
        for caseValue in CharacterState.allCases {
            if caseValue.rawValue.lowercased() == cleaned || String(describing: caseValue).lowercased() == cleaned {
                self = caseValue
                return
            }
        }
        return nil
    }

    /// Convenience initializer with fallback default (.helloAnimation).
    init(fromRawOrAlias string: String) {
        self = CharacterState(rawValue: string) ?? .helloAnimation
    }
}

final class GIFCache {

    static let shared = GIFCache()

    struct GIF {
        let frames: [UIImage]
        let durations: [TimeInterval]
        let totalDuration: TimeInterval
    }

    private var cache: [CharacterState: GIF] = [:]
    private let queue = DispatchQueue(label: "com.sleepmeditation.gifcache", qos: .userInitiated)

    private init() {}

    func preloadAll() {
        queue.async {
            CharacterState.allCases.forEach { state in
                _ = self.loadGIF(for: state)
            }
        }
    }

    func gif(for state: CharacterState) -> GIF? {
        if let gif = cache[state] {
            return gif
        }

        return loadGIF(for: state)
    }

    @discardableResult
    private func loadGIF(for state: CharacterState) -> GIF? {

        if let cached = cache[state] {
            return cached
        }

        guard
            let url = Bundle.main.url(forResource: state.gifName, withExtension: "gif"),
            let source = CGImageSourceCreateWithURL(url as CFURL, nil)
        else {
            return nil
        }

        let count = CGImageSourceGetCount(source)

        var frames: [UIImage] = []
        var durations: [TimeInterval] = []
        var total: TimeInterval = 0

        for index in 0..<count {

            guard let cgImage = CGImageSourceCreateImageAtIndex(source, index, nil)
            else { continue }

            // Pre-decode frame to bitmap on background thread to prevent UI thread rendering stutters
            let decodedImage = GIFCache.decodeFrame(cgImage)
            let duration = GIFCache.frameDuration(source: source, index: index)

            frames.append(decodedImage)
            durations.append(duration)
            total += duration
        }

        let gif = GIF(
            frames: frames,
            durations: durations,
            totalDuration: total
        )

        cache[state] = gif

        return gif
    }

    /// Pre-decodes CGImage into a decompressed UIImage bitmap context for zero-latency GPU rendering.
    private static func decodeFrame(_ cgImage: CGImage) -> UIImage {
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            return UIImage(cgImage: cgImage)
        }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let decodedCGImage = context.makeImage() else {
            return UIImage(cgImage: cgImage)
        }

        return UIImage(cgImage: decodedCGImage)
    }

    private static func frameDuration(
        source: CGImageSource,
        index: Int
    ) -> TimeInterval {

        guard
            let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any],
            let gifProperties = properties[kCGImagePropertyGIFDictionary] as? [CFString: Any]
        else {
            return 0.08
        }

        var delay: Double = 0.08
        if let unclamped = gifProperties[kCGImagePropertyGIFUnclampedDelayTime] as? Double,
           unclamped > 0 {
            delay = unclamped
        } else if let clamped = gifProperties[kCGImagePropertyGIFDelayTime] as? Double,
                  clamped > 0 {
            delay = clamped
        }

        // Standard GIF spec: delay under 20ms (0.02s) is capped at 80ms for optimal smooth speed
        if delay < 0.02 {
            delay = 0.08
        }

        return delay
    }
}

struct GIFPlayer: View {

    let gif: GIFCache.GIF
    var loop: Bool = true
    var smoothLoop: Bool = true
    var enableCrossfade: Bool = true

    @State private var frame = 0
    @State private var previousFrame = 0
    @State private var isReversing = false
    @State private var task: Task<Void, Never>?

    /// Dynamically calculated adaptive crossfade duration preventing frame blur / ghosting overlap
    private var adaptiveCrossfadeDuration: Double {
        guard enableCrossfade && !gif.durations.isEmpty else { return 0 }
        let currentDuration = gif.durations[min(max(0, frame), gif.durations.count - 1)]
        return max(0.02, min(0.06, currentDuration * 0.35))
    }

    var body: some View {

        ZStack {
            if enableCrossfade && previousFrame != frame && previousFrame < gif.frames.count {
                Image(uiImage: gif.frames[previousFrame])
                    .resizable()
                    .scaledToFit()
                    .opacity(0.3)
            }

            if frame < gif.frames.count {
                Image(uiImage: gif.frames[frame])
                    .resizable()
                    .scaledToFit()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: adaptiveCrossfadeDuration), value: frame)
        .onAppear {
            start()
        }
        .onDisappear {
            task?.cancel()
        }
        .onChange(of: gif.frames.count) { _ in
            restart()
        }
    }

    private func restart() {
        task?.cancel()
        frame = 0
        previousFrame = 0
        isReversing = false
        start()
    }

    private func start() {

        task?.cancel()

        task = Task {

            while !Task.isCancelled {

                let rawDuration = gif.durations.indices.contains(frame) ? gif.durations[frame] : 0.08
                let currentDuration = max(0.03, rawDuration)

                try? await Task.sleep(nanoseconds: UInt64(currentDuration * 1_000_000_000))

                if Task.isCancelled { break }

                await MainActor.run {
                    withAnimation(.easeInOut(duration: adaptiveCrossfadeDuration)) {
                        previousFrame = frame
                        if smoothLoop {
                            if !isReversing {
                                if frame < gif.frames.count - 1 {
                                    frame += 1
                                } else if loop {
                                    isReversing = true
                                    frame = max(0, gif.frames.count - 2)
                                } else {
                                    task?.cancel()
                                }
                            } else {
                                if frame > 0 {
                                    frame -= 1
                                } else if loop {
                                    isReversing = false
                                    frame = min(1, gif.frames.count - 1)
                                } else {
                                    task?.cancel()
                                }
                            }
                        } else {
                            if frame < gif.frames.count - 1 {
                                frame += 1
                            } else if loop {
                                frame = 0
                            } else {
                                task?.cancel()
                            }
                        }
                    }
                }
            }
        }
    }
}

struct CharacterView: View {

    @Binding var state: CharacterState
    var enableAmbientMotion: Bool = true
    /// All character GIF animations scaled uniformly by 1.2 (+20%) to match helloanimation1.gif size
    var sizeScale: CGFloat = 1.2

    @State private var gif: GIFCache.GIF?
    @State private var floatOffset: CGFloat = 0

    private var effectiveScale: CGFloat {
        if state == .helloAnimation || state == .notification {
            return sizeScale * 0.8
        }
        return sizeScale
    }

    var body: some View {

        Group {
            if let gif {
                GIFPlayer(
                    gif: gif,
                    loop: true,
                    smoothLoop: true,
                    enableCrossfade: true
                )
                .scaleEffect(effectiveScale)
                .offset(y: floatOffset)
            } else {
                Color.clear
            }
        }
        .onAppear {
            load(state)
            if enableAmbientMotion {
                withAnimation(
                    .easeInOut(duration: 2.4)
                    .repeatForever(autoreverses: true)
                ) {
                    floatOffset = -4
                }
            }
        }
        .onChange(of: state) { newValue in
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                load(newValue)
            }
        }
    }

    private func load(_ state: CharacterState) {
        gif = GIFCache.shared.gif(for: state)
    }
}

@main
struct MyApp: App {

    init() {
        GIFCache.shared.preloadAll()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {

    @State private var character: CharacterState = .helloAnimation

    var body: some View {

        VStack {

            CharacterView(state: $character)

            Button("Thinking") {
                character = .thinking
            }

            Button("Smile") {
                character = .smile
            }

            Button("Fact") {
                character = .fact
            }
        }
    }
}

