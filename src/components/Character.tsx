import React from 'react';
import { GroupProps, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useAnimations } from '@react-three/drei';
import { SkinnedMesh } from 'three';
import { v4 as uuidv4 } from 'uuid';
import api, { ISendText } from '../api/api';
import { playAudioWithResampling } from '../utils/audio';


type CharacterProps = GroupProps & {
    model: string
    message?: string
    animate?: string[]
    api_url?: string
    api_key?: string
    backend_url?: string
};

const Character: React.FC<CharacterProps> = ({ model, animate = [], message = "", api_url, api_key, backend_url, ...props }) => {
    const group = React.useRef(null);
    const { scene, nodes, animations } = useLoader(GLTFLoader, model || "assets/Nong7.glb")
    const { actions } = useAnimations(animations, group)

    const [curFrame, setCurFrame] = React.useState<number>(0)
    const [isAnimating, setIsAnimating] = React.useState<boolean>(false)
    const [blendShapes, setBlendShapes] = React.useState<string>("")
    const [text, setText] = React.useState<string>(message)
    const [response, setResponse] = React.useState<string>("")
    const [arKitFrames, setArKitFrames] = React.useState<number[][]>([]);

    const loadArkitData = async () => {
        if (!blendShapes) return;

        const text = blendShapes;
        const frames = text
            .split("\n")
            .map((line) => line.split(",").map((num) => parseFloat(num)));

        setArKitFrames(frames);
    };

    React.useEffect(() => {
        if (text.trim() === "") console.error("Please enter some message");
        if (!backend_url) return;

        const id = uuidv4();
        const requestsChat = {
            prompt: text,
            sessionid: id,
        };

        api.sendChat(backend_url, requestsChat).then(async (res) => {
            setResponse(JSON.stringify(res.data.response));
        });
    }, [text])

    React.useEffect(() => {
        if (response.trim() === "") console.error("Please enter some message");
        if (!(api_url && api_key)) return;

        const requests: ISendText = {
            input_text: response,
            speaker: 0,
            phrase_break: 0,
            audiovisual: 1,
        };

        api
            .sendText(api_url, api_key, requests)
            .then(async (res) => {
                if (res.data.msg === "success" && api_url && api_key) {
                    const { wav_url, blendshape_url } = res.data;

                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Fetch and set blend shapes
                    const blendShapeResponse = await api.getBlendShapes(blendshape_url, api_key);
                    setBlendShapes(blendShapeResponse.data);

                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Fetch the audio file as a Blob and play it
                    const audioResponse = await api.getVoice(wav_url, api_key);
                    const audioBlob = new Blob([audioResponse.data], {
                        type: "audio/wav",
                    });
                    playAudioWithResampling(audioBlob);
                }
            })
            .catch((e) => console.error(e))
            .finally(() => {
                setText("");
                setIsAnimating(true);
            });
    }, [response])

    React.useEffect(() => {
        loadArkitData();
    }, [blendShapes]);

    React.useEffect(() => {
        actions[animate[0]]?.reset().fadeIn(0.5).play();
    }, []);

    React.useEffect(() => {
        if (arKitFrames.length > 0) {
            const arkitCoefficients = arKitFrames[curFrame];
            const mouthMesh = nodes.face as SkinnedMesh;

            if (mouthMesh.morphTargetInfluences) {
                const mouthOpenValue = arkitCoefficients[26] * 1.0; // jawOpen

                // Calculate MouthSmile
                const mouthSmileValue =
                    (arkitCoefficients[30] + arkitCoefficients[31]) / 2; // mouthSmile_L + mouthSmile_R

                if (!isNaN(mouthOpenValue) && !isNaN(mouthSmileValue)) {
                    mouthMesh.morphTargetInfluences[0] = mouthOpenValue;
                    mouthMesh.morphTargetInfluences[1] = mouthSmileValue;
                }
            }
        }
    }, [curFrame, arKitFrames, nodes]);

    useFrame(() => {
        if (arKitFrames.length > 0 && isAnimating) {
            const frameData = arKitFrames[curFrame];
            const jawOpenValue = frameData[26]; // Assuming index 26 corresponds to jawOpen

            // Access the mouth mesh and set morph target influences for mouth movement
            const mouthMesh = nodes.face as SkinnedMesh;
            if (mouthMesh && mouthMesh.morphTargetInfluences) {
                mouthMesh.morphTargetInfluences[0] = jawOpenValue; // Adjust the mouth opening
            }

            // Move to the next frame or reset to the first frame if at the end
            setCurFrame((prevFrame) => (prevFrame + 1) % arKitFrames.length);

            // Stop animation automatically if it reaches the last frame (optional)
            if (curFrame === arKitFrames.length - 1) {
                setIsAnimating(false);
            }
        }
    });

    return (
        <group ref={group} {...props}>
            <primitive object={scene} />
        </group>
    );
};

export default Character;
