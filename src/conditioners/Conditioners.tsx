import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../components/LabeledSlider"

import { ComfyFile, ComfyResources } from "../Api/Api"
import {
    CLIPVisionEncode,
    CLIPVisionLoader,
    CannyEdgePreprocessor,
    ConditioningAverage_,
    LineArtPreprocessor,
    LoadImage,
    StyleModelApply,
    StyleModelLoader,
    Zoe_DepthMapPreprocessor,
} from "../Api/Nodes"
import { Config } from "../CustomWorkflowPage"
import { ImageUploadZone } from "../components/ImageUploadZone"
import { LabeledCheckbox } from "../components/LabeledCheckbox"
import { BaseConditioner } from "./Base"
import { ControlNetPreprocessorBase } from "./ControlNetBase"

export class ControlNetCannyEdge extends ControlNetPreprocessorBase {
    title = "Canny Edge"
    checkPoint = "t2iadapter_canny_sd15v2.pth"
    PreProcessor = CannyEdgePreprocessor
    propConfig = {
        low_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 100 },
        high_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 200 },
        l2gradient: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}

export class ControlNetDepth extends ControlNetPreprocessorBase {
    title = "Depth"
    checkPoint = "t2iadapter_depth_sd15v2.pth"
    PreProcessor = Zoe_DepthMapPreprocessor
    propConfig = undefined
}

export class ControlNetLineArt extends ControlNetPreprocessorBase {
    title = "Line Art"
    checkPoint = "control_v11p_sd15_lineart.pth"
    PreProcessor = LineArtPreprocessor
    propConfig = {
        coarse: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}

export class ClipVision extends BaseConditioner {
    title = "Clip Vision"
    type = "conditioner" as const
    config = {
        strength: 1,
        image: undefined as ComfyFile | undefined,
    }
    apply(conditioning: { CONDITIONING0: any }, resources: ComfyResources) {
        const image = LoadImage({
            image: this.config.image!.name,
        })

        const clipVisionModel = CLIPVisionLoader({
            clip_name: "clip-vit-large-patch14.bin",
        })

        const styleModel = StyleModelLoader({
            style_model_name: "t2iadapter_style_sd14v1.pth",
        })

        const clipVisionEncoder = CLIPVisionEncode({
            image: image.IMAGE0,
            clip_vision: clipVisionModel.CLIP_VISION0,
        })

        const applier = StyleModelApply({
            style_model: styleModel.STYLE_MODEL0,
            clip_vision_output: clipVisionEncoder.CLIP_VISION_OUTPUT0,
            conditioning: conditioning.CONDITIONING0,
        })

        const averager = ConditioningAverage_({
            conditioning_to: applier.CONDITIONING0,
            conditioning_from: conditioning.CONDITIONING0,
            conditioning_to_strength: this.config.strength,
        })

        return averager
    }

    render = (props: {
        value: ClipVision["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <ImageUploadZone
                    value={props.value.image}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
                    <LabeledSlider
                        value={props.value.strength}
                        onChange={(v) => props.onChange({ ...props.value, strength: v })}
                        min={0}
                        max={1}
                        step={0.01}
                        label="Strength"
                    />
                </Stack>
            </Stack>
        )
    }
}

export class ImageToImage extends BaseConditioner {
    title = "Image To Image"
    type = "config" as const
    config = {
        imageCrop: true,
        imageDenoise: 0.75,
        image: undefined as ComfyFile | undefined,
    }
    apply(config: Config, resources: ComfyResources) {
        config.image = this.config.image
        config.imageDenoise = this.config.imageDenoise
        config.imageCrop = this.config.imageCrop
    }

    render = (props: {
        value: ImageToImage["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <ImageUploadZone
                    value={props.value.image}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
                    <LabeledSlider
                        value={props.value.imageDenoise}
                        onChange={(v) => props.onChange({ ...props.value, imageDenoise: v })}
                        min={0}
                        max={1}
                        step={0.001}
                        label="denoise"
                    />
                    <LabeledCheckbox
                        value={props.value.imageCrop}
                        onChange={(v) => props.onChange({ ...props.value, imageCrop: v })}
                        label="Crop Image"
                    />
                </Stack>
            </Stack>
        )
    }
}