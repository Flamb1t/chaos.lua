local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

local player = Players:FindFirstChild("Flamb1t")
if not player or not player.Character then return end

-- Sound setup
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://107549085149325"
sound.Looped = true
sound.Volume = 3
sound.Name = "ChaosTrack"
sound.Parent = workspace
sound:Play()

-- Name tag
local head = player.Character:FindFirstChild("Head")
if head then
	local tag = Instance.new("BillboardGui")
	tag.Name = "ChaosName"
	tag.Size = UDim2.new(0, 200, 0, 50)
	tag.StudsOffset = Vector3.new(0, 2, 0)
	tag.AlwaysOnTop = true
	tag.Adornee = head
	tag.Parent = head

	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 1, 0)
	label.BackgroundTransparency = 1
	label.Text = "d0wns11de"
	label.TextColor3 = Color3.fromRGB(0, 255, 0)
	label.TextScaled = true
	label.Font = Enum.Font.SourceSansBold
	label.Parent = tag
end

-- Hint utility
local function makeHint(text, duration)
	local h = Instance.new("Hint")
	h.Text = text
	h.Parent = workspace
	task.delay(duration or 2, function()
		h:Destroy()
	end)
end

-- Early warnings
makeHint("d0wns11de is here", 2)
task.wait(2)
makeHint("the game is in danger", 2)
task.wait(2)
makeHint("B7T WH0 C4R3S??", 2)
task.wait(2)
task.wait(20)

-- Countdown
local countdown = 60
while countdown > 0 do
	makeHint("Time Left Until Chaos : " .. countdown, 1)
	task.wait(1)
	countdown -= 1
end

-- Dramatic 5>0 slow
for i = 5, 1, -1 do
	makeHint("Time Left Until Chaos : " .. i, 1)
	if i <= 2 then
		task.wait(6 + (3 - i) * 2)
	else
		task.wait(1)
	end
end

-- Final warning
makeHint("1 W4RN3D 7ALL!! PR3P4RE!", 4)

-- Visual chaos
local function applyParticles(part)
	for _ = 1, 50 do
		local p = Instance.new("ParticleEmitter")
		p.Texture = "rbxassetid://243660364"
		p.Rate = 500
		p.Lifetime = NumberRange.new(1)
		p.Speed = NumberRange.new(5)
		p.Parent = part
		task.delay(2, function() p.Enabled = false end)
	end
end

for _, p in pairs(workspace:GetDescendants()) do
	if p:IsA("BasePart") then
		applyParticles(p)
	end
end

-- Lighting FX
Lighting.Brightness = 10
Lighting.OutdoorAmbient = Color3.new(1, 0, 0)
Lighting.FogEnd = 40

-- Camera FX (LocalCam must run on player side)
spawn(function()
	local cam = workspace.CurrentCamera
	if math.random() < 0.5 then
		for _ = 1, 100 do
			cam.CFrame *= CFrame.Angles(0, math.rad(1.5), 0)
			task.wait(0.03)
		end
	else
		cam.CFrame = CFrame.new(Vector3.new(0, 50, 0), Vector3.new(0, 0, 0))
	end
end)

-- Blur
local blur = Instance.new("BlurEffect", Lighting)
for i = 1, 20 do
	blur.Size = i
	task.wait(0.1)
end

-- Louder music
for i = 1, 5 do
	sound.Volume += 1
	task.wait(0.4)
end

-- End it
task.wait(3)
for _, p in ipairs(Players:GetPlayers()) do
	p:Kick("The End Has Reached You.")
end
