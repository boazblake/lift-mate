Pod::Spec.new do |s|
  s.name = 'CapacitorMediaPipe'
  s.version = '0.0.1'
  s.summary = 'A custom plugin for MediaPipe integration with Capacitor'
  s.license = 'MIT'
  s.homepage = 'https://lift-mate.com'
  s.author = { 'Your Name' => 'your.email@example.com' }
  s.source = { :git => 'https://github.com/your-repo.git', :tag => s.version.to_s }
  s.source_files = 'Sources/CapacitorMediaPipe/**/*.{swift,h,m}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.dependency 'MediaPipeTasksVision', '= 0.10.21'
  s.swift_version = '5.0'
end
