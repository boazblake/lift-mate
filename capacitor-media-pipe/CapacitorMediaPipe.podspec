Pod::Spec.new do |s|
  s.name = 'CapacitorMediaPipe'
  s.version = '0.0.1'
  s.summary = 'A custom plugin for MediaPipe'
  s.license = 'MIT'
  s.homepage = 'https://lift-mate.com'
  s.author = 'Your Name'
  s.source = { :git => 'https://github.com/your-repo', :tag => s.version.to_s }
  s.source_files = 'Sources/CapacitorMediaPipe/**/*.{swift,h,m}'
  s.ios.deployment_target  = '13.0'
  s.dependency 'Capacitor'
end