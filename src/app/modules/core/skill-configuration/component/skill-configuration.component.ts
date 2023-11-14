import { SocketService } from "src/app/service/sockets.service";
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
  EventEmitter,
  Output,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { PrimeNGConfig } from "primeng/api";

@Component({
  selector: "skill-configuration",
  styleUrls: ["./skill-configuration.component.scss"],
  templateUrl: "./skill-configuration.component.html",
})
export class SkillConfigurationComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() template: any;

  form: FormGroup;
  sliderValue: Array<number> = [];
  sliderIndex: any = {};
  @Output() formSubmitted = new EventEmitter<void>();

  constructor(
    private formBuilder: FormBuilder,
    private primeNGConfig: PrimeNGConfig,
    private socketService: SocketService
  ) {
    this.form = this.formBuilder.group({});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["template"] && changes["template"].currentValue) {
      this.createForm();
    }

    if (changes["data"] && changes["data"].currentValue) {
      for (let key in this.data) {
        if (typeof this.sliderIndex[key] != "undefined") {
          this.sliderValue[this.sliderIndex[key]] = this.data[key];
        }
      }
    }
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.socketService.send("command", {
      command: "configure_skill",
      payload: this.form.value,
    });
    this.formSubmitted.emit();
  }

  createForm() {
    const group: any = {};

    if (!this.template.options) {
      return;
    }

    this.form = this.formBuilder.group({});
    this.template.options.forEach((option: any, index: number) => {
      let control;

      switch (option.type) {
        case "string":
        case "secret":
        case "textarea":
          control = this.formBuilder.control(this.data[option.name] || "");
          break;
        case "multistring":
          control = this.formBuilder.array(this.data[option.name] || []);
          break;
        case "multiselect":
        case "dropdown":
          control = this.formBuilder.control(
            this.data[option.name] || option.default || []
          );
          break;
        case "checkbox":
          option.selectedOptions = this.data[option.name];
          control = this.formBuilder.control(
            option.selectedOptions || option.default || []
          );
          break;
        case "radio":
        case "switch":
          control = this.formBuilder.control(this.data[option.name] || false);
          break;
        case "slider":
          this.sliderIndex[option.name] = index;
          control = this.formBuilder.control(this.data[option.name] || 0);
          break;
      }
      this.form.addControl(option.name, control);
    });

    // add vault path to form
    let control = this.formBuilder.control(this.template.vault_path || "");
    this.form.addControl("vault_path", control);
  }

  sliderKeyDown(event: any, max: number, min: number) {
    const pattern = /^[0-9]$/;
    let inputChar = event.key;
    if (
      inputChar == "Backspace" ||
      inputChar == "ArrowLeft" ||
      inputChar == "ArrowRight"
    ) {
      return;
    }

    const inputValue = parseInt(event.target.value) + parseInt(event.key);
    if (inputValue > max) {
      event.target.value = max;
      event.preventDefault();
      return;
    }

    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.primeNGConfig.ripple = true;
  }

  getFormArrayControl(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  addMultiStringItem(event: Event, name: string): void {
    event.preventDefault();
    this.getFormArrayControl(name).push(this.formBuilder.control(""));
  }

  removeMultiStringItem(name: string, index: number): void {
    this.getFormArrayControl(name).removeAt(index);
  }
}
