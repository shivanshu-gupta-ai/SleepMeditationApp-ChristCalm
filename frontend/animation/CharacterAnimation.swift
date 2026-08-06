import Foundation
import UIKit
import ImageIO
import SwiftUI

enum CharacterState: String, CaseIterable {
    case helloAnimation
    case fact
    case didYouKnow
    case anxiety
    case notification
    case smile
    case thinking
    case sad
    case screen

    var gifName: String {
        switch self {
        case .helloAnimation:
            return "bunnyhelloanimation"

        case .fact:
            return "bunnyfact"

        case .didYouKnow:
            return "bunnydidyouknowscreen"

        case .anxiety:
            return "bunnyanxietyscreen"

        case .notification:
            return "bunnynotification"

        case .smile:
            return "bunnysmile"

        case .thinking:
            return "bunnythinking"

        case .sad:
            return "sadbunny"

        case .screen:
            return "helloscreen"
        }
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

    private init() {}

    func preloadAll() {
        DispatchQueue.global(qos: .userInitiated).async {

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

            let duration = GIFCache.frameDuration(source: source, index: index)

            frames.append(UIImage(cgImage: cgImage))
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

    private static func frameDuration(
        source: CGImageSource,
        index: Int
    ) -> TimeInterval {

        guard
            let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any],
            let gifProperties = properties[kCGImagePropertyGIFDictionary] as? [CFString: Any]
        else {
            return 0.1
        }

        if let delay = gifProperties[kCGImagePropertyGIFUnclampedDelayTime] as? Double,
           delay > 0 {
            return delay
        }

        if let delay = gifProperties[kCGImagePropertyGIFDelayTime] as? Double,
           delay > 0 {
            return delay
        }

        return 0.1
    }
}

struct GIFPlayer: View {

    let gif: GIFCache.GIF
    var loop: Bool = true
    var smoothLoop: Bool = true
    var crossfadeDuration: Double = 0.15

    @State private var frame = 0
    @State private var previousFrame = 0
    @State private var isReversing = false
    @State private var task: Task<Void, Never>?

    var body: some View {

        ZStack {
            if previousFrame != frame && previousFrame < gif.frames.count {
                Image(uiImage: gif.frames[previousFrame])
                    .resizable()
                    .scaledToFit()
            }

            Image(uiImage: gif.frames[frame])
                .resizable()
                .scaledToFit()
                .transition(.opacity)
        }
        .animation(.easeInOut(duration: crossfadeDuration), value: frame)
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

                let currentDuration = max(0.06, gif.durations[min(max(0, frame), gif.frames.count - 1)])
                try? await Task.sleep(
                    for: .seconds(currentDuration)
                )

                if Task.isCancelled { break }

                await MainActor.run {
                    withAnimation(.easeInOut(duration: crossfadeDuration)) {
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

    @State private var gif: GIFCache.GIF?

    var body: some View {

        Group {

            if let gif {
                GIFPlayer(gif: gif)
            } else {
                Color.clear
            }

        }
        .onAppear {
            load(state)
        }
        .onChange(of: state) { newValue in
            load(newValue)
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
